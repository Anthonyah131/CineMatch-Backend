import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TmdbService } from './tmdb.service';

@ApiTags('tmdb')
@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('movies/popular')
  @ApiOperation({ summary: 'Get popular movies from TMDb' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiResponse({ status: 200, description: 'Popular movies list retrieved successfully' })
  async getPopularMovies(@Query('page', ParseIntPipe) page?: number) {
    return this.tmdbService.getPopularMovies(page);
  }

  @Get('movies/search')
  @ApiOperation({ summary: 'Search movies in TMDb' })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Search term',
    example: 'Inception',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchMovies(@Query('query') query: string, @Query('page', ParseIntPipe) page?: number) {
    return this.tmdbService.searchMovies(query, page);
  }

  @Get('movies/trending')
  @ApiOperation({ summary: 'Get trending movies from TMDb' })
  @ApiQuery({
    name: 'timeWindow',
    required: false,
    description: 'Time window',
    enum: ['day', 'week'],
    example: 'week',
  })
  @ApiResponse({ status: 200, description: 'Trending movies retrieved successfully' })
  async getTrendingMovies(@Query('timeWindow') timeWindow?: 'day' | 'week') {
    return this.tmdbService.getTrendingMovies(timeWindow);
  }

  @Get('movies/upcoming')
  @ApiOperation({ summary: 'Get upcoming movies from TMDb' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiResponse({ status: 200, description: 'Upcoming movies retrieved successfully' })
  async getUpcomingMovies(@Query('page', ParseIntPipe) page?: number) {
    return this.tmdbService.getUpcomingMovies(page);
  }

  @Get('movies/top-rated')
  @ApiOperation({ summary: 'Get top-rated movies from TMDb' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiResponse({ status: 200, description: 'Top-rated movies retrieved successfully' })
  async getTopRatedMovies(@Query('page', ParseIntPipe) page?: number) {
    return this.tmdbService.getTopRatedMovies(page);
  }

  @Get('movies/:id')
  @ApiOperation({ summary: 'Get specific movie details' })
  @ApiParam({ name: 'id', description: 'TMDb movie ID', example: 27205 })
  @ApiResponse({ status: 200, description: 'Movie details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovieDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieDetails(id);
  }

  @Get('tv/popular')
  @ApiOperation({ summary: 'Get popular TV shows from TMDb' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiResponse({ status: 200, description: 'Popular TV shows list retrieved successfully' })
  async getPopularTVShows(@Query('page', ParseIntPipe) page?: number) {
    return this.tmdbService.getPopularTVShows(page);
  }

  @Get('tv/search')
  @ApiOperation({ summary: 'Search TV shows in TMDb' })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Search term',
    example: 'Breaking Bad',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchTVShows(@Query('query') query: string, @Query('page', ParseIntPipe) page?: number) {
    return this.tmdbService.searchTVShows(query, page);
  }

  @Get('configuration')
  @ApiOperation({ summary: 'Get TMDb API configuration' })
  @ApiResponse({ status: 200, description: 'TMDb configuration retrieved successfully' })
  async getConfiguration() {
    return this.tmdbService.getConfiguration();
  }

  @Get('movies/discover')
  @ApiOperation({ summary: 'Discover movies with advanced filters' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({
    name: 'with_genres',
    required: false,
    description: 'Comma-separated genre IDs',
    example: '28,12',
  })
  @ApiQuery({
    name: 'primary_release_year',
    required: false,
    description: 'Release year',
    example: 2023,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort criteria',
    example: 'popularity.desc',
  })
  @ApiResponse({ status: 200, description: 'Discovered movies retrieved successfully' })
  async discoverMovies(
    @Query() filters: Record<string, any>,
    @Query('page', ParseIntPipe) page?: number,
  ) {
    // Remove 'page' from filters to avoid duplication
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page: pageFromFilters, ...movieFilters } = filters;
    return this.tmdbService.discoverMovies(movieFilters, page);
  }

  @Get('movies/:id/credits')
  @ApiOperation({ summary: 'Get movie credits (cast and crew)' })
  @ApiParam({ name: 'id', description: 'TMDb movie ID', example: 27205 })
  @ApiResponse({ status: 200, description: 'Movie credits retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovieCredits(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieCredits(id);
  }

  @Get('movies/:id/watch/providers')
  @ApiOperation({ summary: 'Get streaming providers for a movie' })
  @ApiParam({ name: 'id', description: 'TMDb movie ID', example: 27205 })
  @ApiResponse({ status: 200, description: 'Streaming providers retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getWatchProviders(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getWatchProviders(id);
  }

  @Get('genres/movies')
  @ApiOperation({ summary: 'Get list of movie genres' })
  @ApiResponse({ status: 200, description: 'Movie genres list retrieved successfully' })
  async getGenres() {
    return this.tmdbService.getGenres();
  }
}
