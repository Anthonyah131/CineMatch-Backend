import { Controller, Get, Query, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { MatchesResponse, PotentialMatch, MatchFilters } from './user-match.model';

@ApiTags('matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get potential matches for current user',
    description:
      'Find users who watched the same movies recently as the current user. Does not store matches in database, computed on-the-fly.',
  })
  @ApiQuery({
    name: 'maxDaysAgo',
    required: false,
    type: Number,
    description: 'Maximum days ago to consider a viewing as recent (default: 30)',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum rating the other user gave (1-5, optional)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of matches to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Potential matches found successfully',
  })
  async getPotentialMatches(
    @CurrentUser('uid') userId: string,
    @Query('maxDaysAgo') maxDaysAgo?: string,
    @Query('minRating') minRating?: string,
    @Query('limit') limit?: string,
  ): Promise<MatchesResponse> {
    const filters: MatchFilters = {
      maxDaysAgo: maxDaysAgo ? parseInt(maxDaysAgo) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    return this.matchesService.findPotentialMatches(userId, filters);
  }

  @Get('movie/:movieId')
  @ApiOperation({
    summary: 'Get matches for a specific movie',
    description: 'Find all users who watched the same movie recently as the current user',
  })
  @ApiParam({
    name: 'movieId',
    description: 'TMDB movie ID',
    type: Number,
  })
  @ApiQuery({
    name: 'maxDaysAgo',
    required: false,
    type: Number,
    description: 'Maximum days ago to consider (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users who watched this movie retrieved successfully',
  })
  async getMatchesForMovie(
    @CurrentUser('uid') userId: string,
    @Param('movieId') movieId: string,
    @Query('maxDaysAgo') maxDaysAgo?: string,
  ): Promise<PotentialMatch[]> {
    return this.matchesService.getMatchesForMovie(
      userId,
      parseInt(movieId),
      maxDaysAgo ? parseInt(maxDaysAgo) : undefined,
    );
  }
}
