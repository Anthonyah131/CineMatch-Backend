import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { List } from './list.model';

@ApiTags('lists')
@ApiBearerAuth()
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new list for current user' })
  @ApiResponse({ status: 201, description: 'List created successfully' })
  async createList(
    @CurrentUser('uid') userId: string,
    @Body() listData: CreateListDto,
  ): Promise<List> {
    return this.listsService.createList(userId, listData);
  }

  @Get('my-lists')
  @ApiOperation({ summary: 'Get all lists for current user' })
  @ApiResponse({ status: 200, description: 'User lists retrieved successfully' })
  async getMyLists(@CurrentUser('uid') userId: string): Promise<List[]> {
    return this.listsService.getUserLists(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all lists for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User lists retrieved successfully' })
  async getUserLists(@Param('userId') userId: string): Promise<List[]> {
    return this.listsService.getUserLists(userId);
  }

  @Get(':listId')
  @ApiOperation({ summary: 'Get a specific list by ID' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'List retrieved successfully' })
  async getListById(@Param('listId') listId: string): Promise<List> {
    return this.listsService.getListById(listId);
  }

  @Put(':listId')
  @ApiOperation({ summary: 'Update a list' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'List updated successfully' })
  async updateList(
    @Param('listId') listId: string,
    @Body() updateData: Partial<List>,
  ): Promise<List> {
    return this.listsService.updateList(listId, updateData);
  }

  @Delete(':listId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a list' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 204, description: 'List deleted successfully' })
  async deleteList(@Param('listId') listId: string): Promise<void> {
    return this.listsService.deleteList(listId);
  }
}
