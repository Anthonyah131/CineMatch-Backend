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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import type { User, FavoriteItem } from './user.model';
import type { Follower, Following } from './user-relations.model';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Users Controller - Manages user profiles, favorites, and social features
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== USER INFO ====================

  @Get(':uid')
  @ApiOperation({
    summary: 'Get user basic information',
    description:
      'Retrieves basic user data by Firebase UID. Use /users/:uid/profile for complete profile.',
  })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('uid') uid: string): Promise<User | null> {
    return this.usersService.getUserById(uid);
  }

  @Get(':uid/profile')
  @ApiOperation({
    summary: 'Get user public profile',
    description:
      'Retrieves complete public profile including stats (followers, following, favorites count) and recent favorites. ' +
      'Use this endpoint to display user profiles.',
  })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved',
    schema: {
      example: {
        user: {
          displayName: 'John Doe',
          email: 'john@example.com',
          photoURL: 'https://...',
          bio: 'Movie lover',
          followersCount: 150,
          followingCount: 85,
        },
        stats: {
          totalFavorites: 42,
          followersCount: 150,
          followingCount: 85,
        },
        recentFavorites: [
          {
            tmdbId: 550,
            title: 'Fight Club',
            mediaType: 'movie',
            posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
            addedAt: '2024-11-03T19:30:00Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('uid') uid: string): Promise<{
    user: Omit<User, 'settings' | 'authProviders' | 'emailVerified'>;
    stats: {
      totalFavorites: number;
      followersCount: number;
      followingCount: number;
    };
    recentFavorites: FavoriteItem[];
  }> {
    return this.usersService.getUserProfile(uid);
  }

  @Get(':uid/complete-profile')
  @ApiOperation({
    summary: 'Get complete user profile for visiting',
    description:
      "Retrieves comprehensive profile data for visiting another user's profile page. " +
      'Includes user info, complete stats, recent favorites, latest 10 viewing logs, and latest 10 reviews. ' +
      "Perfect for displaying another user's complete profile.",
  })
  @ApiParam({ name: 'uid', description: 'Firebase UID of the user to visit' })
  @ApiResponse({
    status: 200,
    description: 'Complete profile retrieved successfully',
    schema: {
      example: {
        user: {
          displayName: 'John Doe',
          email: 'john@example.com',
          photoURL: 'https://...',
          bio: 'Movie enthusiast 🍿',
          birthdate: '1990-01-15',
          followersCount: 150,
          followingCount: 85,
          createdAt: '2024-01-15T10:30:00Z',
        },
        stats: {
          totalFavorites: 42,
          followersCount: 150,
          followingCount: 85,
          totalMoviesWatched: 127,
          totalTvShowsWatched: 23,
          totalViews: 203,
          totalReviews: 45,
          averageRating: 4.2,
        },
        recentFavorites: [
          {
            tmdbId: 550,
            title: 'Fight Club',
            mediaType: 'movie',
            posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
            addedAt: '2024-11-03T19:30:00Z',
          },
        ],
        recentLogs: [
          {
            id: 'log123',
            tmdbId: 157336,
            mediaType: 'movie',
            rating: 5,
            review: 'Incredible sci-fi masterpiece with stunning visuals...',
            watchedAt: '2024-11-05T21:00:00Z',
            hadSeenBefore: false,
          },
        ],
        recentReviews: [
          {
            id: 'log123',
            tmdbId: 157336,
            mediaType: 'movie',
            rating: 5,
            review: 'Incredible sci-fi masterpiece with stunning visuals and emotional depth.',
            reviewLang: 'en',
            watchedAt: '2024-11-05T21:00:00Z',
            createdAt: '2024-11-05T21:15:00Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCompleteUserProfile(@Param('uid') uid: string): Promise<{
    user: Omit<User, 'settings' | 'authProviders' | 'emailVerified'>;
    stats: {
      totalFavorites: number;
      followersCount: number;
      followingCount: number;
      totalMoviesWatched: number;
      totalTvShowsWatched: number;
      totalViews: number;
      totalReviews: number;
      averageRating: number;
    };
    recentFavorites: FavoriteItem[];
    recentLogs: any[];
    recentReviews: any[];
  }> {
    return this.usersService.getCompleteUserProfile(uid);
  }

  // ==================== FAVORITES ====================

  @Get('me/favorites')
  @ApiOperation({
    summary: 'Get my favorites',
    description: 'Retrieves authenticated user favorites list, sorted by most recent first.',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorites retrieved',
    schema: {
      example: [
        {
          tmdbId: 550,
          title: 'Fight Club',
          mediaType: 'movie',
          posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          addedAt: '2024-11-03T19:30:00Z',
        },
      ],
    },
  })
  async getCurrentUserFavorites(@CurrentUser('uid') uid: string): Promise<FavoriteItem[]> {
    return this.usersService.getFavorites(uid);
  }

  @Get(':uid/favorites')
  @ApiOperation({
    summary: 'Get user favorites',
    description: "Retrieves another user's favorites list.",
  })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserFavorites(@Param('uid') uid: string): Promise<FavoriteItem[]> {
    return this.usersService.getFavorites(uid);
  }

  // ==================== USER MANAGEMENT ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create user',
    description: 'Creates a new user (typically called by auth service). Not for public use.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  @Put('me')
  @ApiOperation({
    summary: 'Update my profile',
    description: 'Updates authenticated user profile information (name, bio, photo, etc.).',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCurrentUser(
    @CurrentUser('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(uid, updateUserDto);
  }

  @Put(':uid')
  @ApiOperation({
    summary: 'Update user (admin)',
    description: 'Admin endpoint to update any user.',
  })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('uid') uid: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(uid, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete my account',
    description: 'Permanently deletes authenticated user account. This action cannot be undone.',
  })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteCurrentUser(@CurrentUser('uid') uid: string): Promise<void> {
    return this.usersService.deleteUser(uid);
  }

  @Delete(':uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user (admin)',
    description: 'Admin endpoint to delete any user.',
  })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('uid') uid: string): Promise<void> {
    return this.usersService.deleteUser(uid);
  }

  @Post('me/favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add movie/show to my favorites',
    description: 'Adds a movie or TV show to authenticated user favorites list.',
  })
  @ApiBody({
    type: AddFavoriteDto,
    examples: {
      movie: {
        summary: 'Add a movie',
        value: {
          tmdbId: 550,
          title: 'Fight Club',
          mediaType: 'movie',
          posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        },
      },
      tv: {
        summary: 'Add a TV show',
        value: {
          tmdbId: 1396,
          title: 'Breaking Bad',
          mediaType: 'tv',
          posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Added to favorites' })
  @ApiResponse({ status: 409, description: 'Already in favorites' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addFavoriteToCurrentUser(
    @CurrentUser('uid') uid: string,
    @Body() addFavoriteDto: AddFavoriteDto,
  ): Promise<void> {
    const favoriteItem: FavoriteItem = {
      tmdbId: addFavoriteDto.tmdbId,
      title: addFavoriteDto.title,
      mediaType: addFavoriteDto.mediaType as 'movie' | 'tv',
      posterPath: addFavoriteDto.posterPath,
      addedAt: new Date(),
    };
    return this.usersService.addFavorite(uid, favoriteItem);
  }

  /**
   * Add favorite item (admin endpoint)
   */
  @Post(':uid/favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a movie/show to user favorites (admin)' })
  @ApiParam({ name: 'uid', description: 'User unique identifier' })
  @ApiBody({ type: AddFavoriteDto })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Item already in favorites' })
  async addFavorite(
    @Param('uid') uid: string,
    @Body() addFavoriteDto: AddFavoriteDto,
  ): Promise<void> {
    const favoriteItem: FavoriteItem = {
      tmdbId: addFavoriteDto.tmdbId,
      title: addFavoriteDto.title,
      mediaType: addFavoriteDto.mediaType as 'movie' | 'tv',
      posterPath: addFavoriteDto.posterPath,
      addedAt: new Date(),
    };
    return this.usersService.addFavorite(uid, favoriteItem);
  }

  @Delete('me/favorites/:tmdbId/:mediaType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove from my favorites',
    description: 'Removes a movie or TV show from authenticated user favorites.',
  })
  @ApiParam({ name: 'tmdbId', description: 'TMDB ID', example: 550 })
  @ApiParam({ name: 'mediaType', description: 'Media type', enum: ['movie', 'tv'] })
  @ApiResponse({ status: 204, description: 'Removed from favorites' })
  async removeFavoriteFromCurrentUser(
    @CurrentUser('uid') uid: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('mediaType') mediaType: string,
  ): Promise<void> {
    return this.usersService.removeFavorite(uid, tmdbId, mediaType);
  }

  @Delete(':uid/favorites/:tmdbId/:mediaType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove from favorites (admin)' })
  @ApiParam({ name: 'uid', description: 'Firebase UID' })
  @ApiParam({ name: 'tmdbId', description: 'TMDB ID' })
  @ApiParam({ name: 'mediaType', enum: ['movie', 'tv'] })
  @ApiResponse({ status: 204, description: 'Removed' })
  async removeFavorite(
    @Param('uid') uid: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('mediaType') mediaType: string,
  ): Promise<void> {
    return this.usersService.removeFavorite(uid, tmdbId, mediaType);
  }

  // ==================== SOCIAL (FOLLOW/UNFOLLOW) ====================

  @Post('follow/:targetUid')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Follow user',
    description: 'Authenticated user follows another user. Updates follower/following counts.',
  })
  @ApiParam({ name: 'targetUid', description: 'User to follow' })
  @ApiResponse({ status: 201, description: 'Now following' })
  @ApiResponse({ status: 409, description: 'Cannot follow yourself' })
  async followUserAsCurrent(
    @CurrentUser('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<void> {
    return this.usersService.followUser(followerUid, followedUid);
  }

  @Delete('follow/:targetUid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unfollow user',
    description: 'Authenticated user unfollows another user.',
  })
  @ApiParam({ name: 'targetUid', description: 'User to unfollow' })
  @ApiResponse({ status: 204, description: 'Unfollowed' })
  async unfollowUserAsCurrent(
    @CurrentUser('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<void> {
    return this.usersService.unfollowUser(followerUid, followedUid);
  }

  @Post(':uid/follow/:targetUid')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Follow user (admin)' })
  @ApiParam({ name: 'uid', description: 'Follower UID' })
  @ApiParam({ name: 'targetUid', description: 'User to follow' })
  async followUser(
    @Param('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<void> {
    return this.usersService.followUser(followerUid, followedUid);
  }

  @Delete(':uid/follow/:targetUid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow user (admin)' })
  @ApiParam({ name: 'uid', description: 'Follower UID' })
  @ApiParam({ name: 'targetUid', description: 'User to unfollow' })
  async unfollowUser(
    @Param('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<void> {
    return this.usersService.unfollowUser(followerUid, followedUid);
  }

  // ==================== FOLLOWERS/FOLLOWING ====================

  @Get('me/followers')
  @ApiOperation({
    summary: 'Get my followers',
    description: 'Returns list of users following me with their basic profile information.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Followers list with user information',
    schema: {
      example: [
        {
          uid: 'M1CVo2OdFGXA9nyLCvRnGF5rBg13',
          displayName: 'John Doe',
          photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
          bio: 'Movie enthusiast 🍿',
          followedAt: '2024-11-03T19:30:00Z',
        },
      ],
    },
  })
  async getCurrentUserFollowers(
    @CurrentUser('uid') uid: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<Follower[]> {
    return this.usersService.getFollowers(uid, limit);
  }

  @Get('me/following')
  @ApiOperation({
    summary: 'Get who I follow',
    description: 'Returns list of users I am following with their basic profile information.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Following list with user information',
    schema: {
      example: [
        {
          uid: 'N2DWp3PeFHYB0ozMDwSoHG6sChg24',
          displayName: 'Jane Smith',
          photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocL...',
          bio: 'Sci-Fi lover 🚀',
          followedAt: '2024-11-02T15:20:00Z',
        },
      ],
    },
  })
  async getCurrentUserFollowing(
    @CurrentUser('uid') uid: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<Following[]> {
    return this.usersService.getFollowing(uid, limit);
  }

  @Get('me/following-activity')
  @ApiOperation({
    summary: 'Obtener actividad de personas que sigo',
    description:
      'Devuelve los últimos 10 logs/reviews de las personas que sigo (amigos). ' +
      'Perfecto para mostrar un feed de actividad en el home.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de actividades a devolver',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Feed de actividad obtenido exitosamente',
    schema: {
      example: [
        {
          id: 'log123',
          userId: 'user456',
          userName: 'John Doe',
          userPhoto: 'https://...',
          tmdbId: 550,
          mediaType: 'movie',
          title: 'Fight Club',
          posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          rating: 5,
          review: 'Increíble película con giros inesperados',
          reviewLang: 'es',
          watchedAt: { _seconds: 1699048800, _nanoseconds: 0 },
          createdAt: { _seconds: 1699048800, _nanoseconds: 0 },
        },
      ],
    },
  })
  async getFollowingActivityFeed(
    @CurrentUser('uid') uid: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getFollowingActivityFeed(uid, limit);
  }

  @Get('me/following/:targetUid')
  @ApiOperation({
    summary: 'Check if I follow user',
    description: 'Returns whether authenticated user follows target user.',
  })
  @ApiParam({ name: 'targetUid', description: 'User UID' })
  @ApiResponse({ status: 200, schema: { example: { isFollowing: true } } })
  async isCurrentUserFollowing(
    @CurrentUser('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.usersService.isFollowing(followerUid, followedUid);
    return { isFollowing };
  }

  @Get(':uid/followers')
  @ApiOperation({
    summary: 'Get user followers',
    description:
      'Returns list of users following the specified user with their profile information.',
  })
  @ApiParam({ name: 'uid', description: 'User UID' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Followers list with user information',
  })
  async getFollowers(
    @Param('uid') uid: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<Follower[]> {
    return this.usersService.getFollowers(uid, limit);
  }

  @Get(':uid/following')
  @ApiOperation({
    summary: 'Get user following',
    description:
      'Returns list of users that the specified user is following with their profile information.',
  })
  @ApiParam({ name: 'uid', description: 'User UID' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Following list with user information',
  })
  async getFollowing(
    @Param('uid') uid: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<Following[]> {
    return this.usersService.getFollowing(uid, limit);
  }

  @Get(':uid/following/:targetUid')
  @ApiOperation({ summary: 'Check if user A follows user B' })
  @ApiParam({ name: 'uid', description: 'Follower UID' })
  @ApiParam({ name: 'targetUid', description: 'Followed UID' })
  async isFollowing(
    @Param('uid') followerUid: string,
    @Param('targetUid') followedUid: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.usersService.isFollowing(followerUid, followedUid);
    return { isFollowing };
  }

  // ==================== SEARCH ====================

  @Get()
  @ApiOperation({
    summary: 'Search users',
    description: 'Search users by display name. Returns empty array if query is empty.',
  })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'John' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Search results' })
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
