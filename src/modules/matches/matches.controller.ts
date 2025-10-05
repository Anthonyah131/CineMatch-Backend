import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import type { UserMatch, UserSwipe } from './user-match.model';

export class SwipeDto {
  userId: string;
  movieId: number;
  liked: boolean;
}

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all matches for a user' })
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
  @ApiOperation({ summary: 'Record a user swipe (like/pass) on a movie' })
  @ApiBody({ type: SwipeDto })
  @ApiResponse({ status: 201, description: 'Swipe recorded successfully' })
  async recordSwipe(@Body() swipeDto: SwipeDto): Promise<UserSwipe> {
    return this.matchesService.recordSwipe(swipeDto.userId, swipeDto.movieId, swipeDto.liked);
  }

  @Post('check-mutual/:userId1/:userId2/:movieId')
  @ApiOperation({ summary: 'Check if two users have mutual like for a movie' })
  @ApiParam({ name: 'userId1', description: 'First user ID' })
  @ApiParam({ name: 'userId2', description: 'Second user ID' })
  @ApiParam({ name: 'movieId', description: 'Movie TMDB ID' })
  @ApiResponse({ status: 200, description: 'Mutual like status checked' })
  async checkMutualLike(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
    @Param('movieId') movieId: string,
  ): Promise<{ hasMutualLike: boolean }> {
    const hasMutualLike = await this.matchesService.checkMutualLike(
      userId1,
      userId2,
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
