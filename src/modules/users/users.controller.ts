import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { User, FavoriteItem } from './user.model';
import type { Follower, Following } from './user-relations.model';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get user by ID
   */
  @Get(':uid')
  @ApiOperation({ summary: 'Get user by UID' })
  @ApiParam({ name: 'uid', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('uid') uid: string): Promise<User | null> {
    return this.usersService.getUserById(uid);
  }

  /**
   * Create a new user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  /**
   * Update user
   */
  @Put(':uid')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'uid', description: 'User unique identifier' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('uid') uid: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(uid, updateUserDto);
  }

  /**
   * Delete user
   */
  @Delete(':uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user account' })
  @ApiParam({ name: 'uid', description: 'User unique identifier' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('uid') uid: string): Promise<void> {
    return this.usersService.deleteUser(uid);
  }

  /**
   * Add favorite item
   */
  @Post(':uid/favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a movie/show to user favorites' })
  @ApiParam({ name: 'uid', description: 'User unique identifier' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addFavorite(@Param('uid') uid: string, @Body() favoriteItem: FavoriteItem): Promise<void> {
    return this.usersService.addFavorite(uid, favoriteItem);
  }

  /**
   * Remove favorite item
   */
  @Delete(':uid/favorites/:tmdbId/:mediaType')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(
    @Param('uid') uid: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('mediaType') mediaType: string,
  ): Promise<void> {
    return this.usersService.removeFavorite(uid, tmdbId, mediaType);
  }

  /**
   * Follow a user
   */
  @Post(':uid/follow/:targetUid')
  @HttpCode(HttpStatus.CREATED)
  async followUser(
    @Param('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<void> {
    return this.usersService.followUser(followerUid, followedUid);
  }

  /**
   * Unfollow a user
   */
  @Delete(':uid/follow/:targetUid')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowUser(
    @Param('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<void> {
    return this.usersService.unfollowUser(followerUid, followedUid);
  }

  /**
   * Get user's followers
   */
  @Get(':uid/followers')
  async getFollowers(
    @Param('uid') uid: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<Follower[]> {
    return this.usersService.getFollowers(uid, limit);
  }

  /**
   * Get user's following
   */
  @Get(':uid/following')
  async getFollowing(
    @Param('uid') uid: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<Following[]> {
    return this.usersService.getFollowing(uid, limit);
  }

  /**
   * Check if user A follows user B
   */
  @Get(':uid/following/:targetUid')
  async isFollowing(
    @Param('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.usersService.isFollowing(followerUid, followedUid);
    return { isFollowing };
  }

  /**
   * Search users
   */
  @Get()
  @ApiOperation({ summary: 'Search users by display name' })
  @ApiQuery({ name: 'q', description: 'Search query string' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<User[]> {
    if (!query) {
      return [];
    }
    return this.usersService.searchUsers(query, limit);
  }
}
