import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { List, ListItem } from './list.model';

/**
 * Controller for managing user lists and list items
 * Handles all list-related operations including CRUD for lists and items
 */
@ApiTags('lists')
@ApiBearerAuth()
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  // ======================
  // LIST OPERATIONS
  // ======================

  @Post()
  @ApiOperation({
    summary: 'Create a new list',
    description:
      'Create a new list with optional cover. If no cover is provided, it will be empty until the first item is added.',
  })
  @ApiResponse({ status: 201, description: 'List created successfully' })
  async createList(
    @CurrentUser('uid') userId: string,
    @Body() listData: CreateListDto,
  ): Promise<List> {
    return this.listsService.createList(userId, listData);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search public lists by title',
    description: 'Search for public lists by title with pagination. Only returns public lists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated search results with owner display name',
  })
  async searchPublicLists(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.listsService.searchPublicLists(query, page, limit);
  }

  @Get('my-lists')
  @ApiOperation({ summary: 'Get all lists for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all lists owned by the current user',
  })
  async getMyLists(@CurrentUser('uid') userId: string): Promise<List[]> {
    return this.listsService.getUserLists(userId, userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get public lists for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns public lists for the specified user',
  })
  async getUserLists(
    @Param('userId') userId: string,
    @CurrentUser('uid') currentUserId: string,
  ): Promise<List[]> {
    return this.listsService.getUserLists(userId, currentUserId);
  }

  @Get(':listId')
  @ApiOperation({ summary: 'Get a specific list by ID' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'List retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied to private list' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async getListById(
    @Param('listId') listId: string,
    @CurrentUser('uid') userId: string,
  ): Promise<List> {
    return this.listsService.getListById(listId, userId);
  }

  @Put(':listId')
  @ApiOperation({
    summary: 'Update a list',
    description: 'Update list properties: title, description, visibility, cover',
  })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'List updated successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can update list' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async updateList(
    @Param('listId') listId: string,
    @CurrentUser('uid') userId: string,
    @Body() updateData: UpdateListDto,
  ): Promise<List> {
    return this.listsService.updateList(listId, userId, updateData);
  }

  @Delete(':listId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a list' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 204, description: 'List deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can delete list' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async deleteList(
    @Param('listId') listId: string,
    @CurrentUser('uid') userId: string,
  ): Promise<void> {
    return this.listsService.deleteList(listId, userId);
  }

  // ======================
  // LIST ITEMS OPERATIONS
  // ======================

  @Get(':listId/items')
  @ApiOperation({ summary: 'Get all items in a list' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({
    status: 200,
    description: 'List items retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Access denied to private list' })
  @ApiResponse({ status: 404, description: 'List not found' })
  async getListItems(
    @Param('listId') listId: string,
    @CurrentUser('uid') userId: string,
  ): Promise<ListItem[]> {
    return this.listsService.getListItems(listId, userId);
  }

  @Post(':listId/items')
  @ApiOperation({
    summary: 'Add a media item to a list',
    description: 'Add item to list. First item becomes cover if none set.',
  })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can add items' })
  @ApiResponse({ status: 404, description: 'List not found' })
  @ApiResponse({ status: 409, description: 'Item already exists in list' })
  async addListItem(
    @Param('listId') listId: string,
    @CurrentUser('uid') userId: string,
    @Body() itemData: AddListItemDto,
  ): Promise<ListItem> {
    return this.listsService.addListItem(listId, userId, itemData);
  }

  @Patch(':listId/items/:itemId')
  @ApiOperation({ summary: 'Update a list item' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can update items' })
  @ApiResponse({ status: 404, description: 'List or item not found' })
  async updateListItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('uid') userId: string,
    @Body() updateData: UpdateListItemDto,
  ): Promise<ListItem> {
    return this.listsService.updateListItem(listId, itemId, userId, updateData);
  }

  @Delete(':listId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a media item from a list' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({ status: 204, description: 'Item removed successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can remove items' })
  @ApiResponse({ status: 404, description: 'List or item not found' })
  async removeListItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('uid') userId: string,
  ): Promise<void> {
    return this.listsService.removeListItem(listId, itemId, userId);
  }
}
