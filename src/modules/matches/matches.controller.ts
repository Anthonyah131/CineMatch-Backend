import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserMatch, UserSwipe } from './user-match.model';

export class SwipeDto {
  movieId: number;
  liked: boolean;
}

@ApiTags('matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('my-matches')
  @ApiOperation({ summary: 'Get all matches for current user' })
  @ApiResponse({ status: 200, description: 'User matches retrieved successfully' })
  async getMyMatches(@CurrentUser('uid') userId: string): Promise<UserMatch[]> {
    return this.matchesService.getUserMatches(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all matches for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User matches retrieved successfully' })
  async getUserMatches(@Param('userId') userId: string): Promise<UserMatch[]> {
    return this.matchesService.getUserMatches(userId);
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Get match details by ID' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match details retrieved successfully' })
  async getMatchById(@Param('matchId') matchId: string): Promise<UserMatch | null> {
    return this.matchesService.getMatchById(matchId);
  }

  @Post('swipe')
  @ApiOperation({ summary: 'Record current user swipe (like/pass) on a movie' })
  @ApiBody({ type: SwipeDto })
  @ApiResponse({ status: 201, description: 'Swipe recorded successfully' })
  async recordSwipe(
    @CurrentUser('uid') userId: string,
    @Body() swipeDto: SwipeDto,
  ): Promise<UserSwipe> {
    return this.matchesService.recordSwipe(userId, swipeDto.movieId, swipeDto.liked);
  }

  @Post('check-mutual/:targetUserId/:movieId')
  @ApiOperation({ summary: 'Check if current user and another user have mutual like for a movie' })
  @ApiParam({ name: 'targetUserId', description: 'Target user ID to check mutual like with' })
  @ApiParam({ name: 'movieId', description: 'Movie TMDB ID' })
  @ApiResponse({ status: 200, description: 'Mutual like status checked' })
  async checkMutualLike(
    @CurrentUser('uid') currentUserId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('movieId') movieId: string,
  ): Promise<{ hasMutualLike: boolean }> {
    const hasMutualLike = await this.matchesService.checkMutualLike(
      currentUserId,
      targetUserId,
      parseInt(movieId),
    );
    return { hasMutualLike };
  }

  @Delete(':matchId')
  @ApiOperation({ summary: 'Delete/unmatch a match' })
  @ApiParam({ name: 'matchId', description: 'Match ID to delete' })
  @ApiResponse({ status: 200, description: 'Match deleted successfully' })
  async deleteMatch(@Param('matchId') matchId: string): Promise<{ success: boolean }> {
    await this.matchesService.deleteMatch(matchId);
    return { success: true };
  }
}
