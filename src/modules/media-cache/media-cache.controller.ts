import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Post,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MediaCacheService } from './media-cache.service';
import { TmdbService } from '../tmdb/tmdb.service';
import type { MediaCache } from './media-cache.model';
import type { TmdbMovieDetails, TmdbTVShowDetails } from '../tmdb/tmdb.service';

/**
 * Controller for media cache operations
 * Manages local caching of TMDb data to reduce external API calls
 */
@ApiTags('media-cache')
@ApiBearerAuth()
@Controller('media-cache')
export class MediaCacheController {
  constructor(
    private readonly mediaCacheService: MediaCacheService,
    private readonly tmdbService: TmdbService,
  ) {}

  // ==================== CACHE QUERY OPERATIONS ====================

  @Get('cache/search')
  @ApiOperation({
    summary: 'Search cached media by title',
    description: 'Search for movies/TV shows in local cache (case-insensitive, max 20 results)',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Search term', example: 'matrix' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by media type',
    enum: ['movie', 'tv'],
  })
  @ApiResponse({
    status: 200,
    description: 'Search results from cache',
    example: [
      {
        tmdbId: 603,
        mediaType: 'movie',
        title: 'The Matrix',
        posterPath: '/path.jpg',
        releaseYear: 1999,
        genres: [28, 878],
        voteAverage: 8.7,
      },
    ],
  })
  async searchCachedMedia(
    @Query('query') query: string,
    @Query('type') type?: 'movie' | 'tv',
  ): Promise<MediaCache[]> {
    return this.mediaCacheService.searchCachedMedia(query, type);
  }

  @Get('cache/popular/:mediaType')
  @ApiOperation({
    summary: 'Get popular cached media',
    description: 'Retrieve popular movies/TV shows sorted by vote average',
  })
  @ApiParam({ name: 'mediaType', enum: ['movie', 'tv'], description: 'Type of media' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum results',
    example: 20,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Popular media list from cache' })
  async getPopularCachedMedia(
    @Param('mediaType') mediaType: 'movie' | 'tv',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<MediaCache[]> {
    return this.mediaCacheService.getPopularCachedMedia(mediaType, limit);
  }

  @Get('cache/recent')
  @ApiOperation({
    summary: 'Get recently cached media',
    description: 'Retrieve recently added or updated media from cache',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum results',
    example: 20,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Recent media list from cache' })
  async getRecentCachedMedia(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<MediaCache[]> {
    return this.mediaCacheService.getRecentCachedMedia(limit);
  }

  @Get('cache/:tmdbId/:mediaType')
  @ApiOperation({
    summary: 'Get specific media from cache',
    description: 'Retrieve cached data for a specific movie or TV show',
  })
  @ApiParam({ name: 'tmdbId', description: 'TMDb ID', example: 550, type: Number })
  @ApiParam({ name: 'mediaType', enum: ['movie', 'tv'], description: 'Type of media' })
  @ApiResponse({ status: 200, description: 'Media data from cache' })
  @ApiResponse({ status: 404, description: 'Media not found in cache' })
  async getCachedMedia(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('mediaType') mediaType: 'movie' | 'tv',
  ): Promise<MediaCache | null> {
    return this.mediaCacheService.getCachedMedia(tmdbId, mediaType);
  }

  @Get('cache/stats')
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Retrieve total cached media count by type',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics',
    example: { totalCached: 150, moviesCached: 100, tvCached: 50 },
  })
  async getCacheStats(): Promise<{ totalCached: number; moviesCached: number; tvCached: number }> {
    return this.mediaCacheService.getCacheStats();
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  @Post('cache/save-movie/:tmdbId')
  @ApiOperation({
    summary: 'Manually cache a movie',
    description: 'Fetch movie from TMDb and save to cache (skips if valid cache exists)',
  })
  @ApiParam({ name: 'tmdbId', description: 'TMDb movie ID', example: 550, type: Number })
  @ApiResponse({ status: 200, description: 'Movie cached successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found in TMDb' })
  async saveMovieToCache(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ): Promise<{ message: string }> {
    const isCached = await this.mediaCacheService.isCacheValid(tmdbId, 'movie');
    if (isCached) {
      return { message: 'Película ya está en caché y es válida' };
    }

    const movieDetails = await this.tmdbService.getMovieDetails(tmdbId);
    await this.mediaCacheService.saveMovieToCache(movieDetails);

    return { message: 'Película guardada en caché exitosamente' };
  }

  @Post('cache/save-tv/:tmdbId')
  @ApiOperation({
    summary: 'Manually cache a TV show',
    description: 'Fetch TV show from TMDb and save to cache (skips if valid cache exists)',
  })
  @ApiParam({ name: 'tmdbId', description: 'TMDb TV show ID', example: 1396, type: Number })
  @ApiResponse({ status: 200, description: 'TV show cached successfully' })
  @ApiResponse({ status: 404, description: 'TV show not found in TMDb' })
  async saveTVShowToCache(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ): Promise<{ message: string }> {
    const isCached = await this.mediaCacheService.isCacheValid(tmdbId, 'tv');
    if (isCached) {
      return { message: 'Serie ya está en caché y es válida' };
    }

    const tvDetails = await this.tmdbService.getTVShowDetails(tmdbId);
    await this.mediaCacheService.saveTVShowToCache(tvDetails);

    return { message: 'Serie guardada en caché exitosamente' };
  }

  @Delete('cache/:tmdbId/:mediaType')
  @ApiOperation({
    summary: 'Delete cached media',
    description: 'Remove media from cache by TMDb ID and type',
  })
  @ApiParam({ name: 'tmdbId', description: 'TMDb ID', example: 550, type: Number })
  @ApiParam({ name: 'mediaType', enum: ['movie', 'tv'], description: 'Type of media' })
  @ApiResponse({ status: 200, description: 'Media deleted from cache' })
  @ApiResponse({ status: 404, description: 'Media not found in cache' })
  async deleteCachedMedia(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('mediaType') mediaType: 'movie' | 'tv',
  ): Promise<{ message: string }> {
    await this.mediaCacheService.deleteCachedMedia(tmdbId, mediaType);
    return { message: 'Media eliminada del caché exitosamente' };
  }

  // ==================== HYBRID ENDPOINTS ====================

  @Get('hybrid/movie/:tmdbId')
  @ApiOperation({
    summary: 'Get movie (hybrid: cache-first strategy)',
    description:
      'Returns movie from cache if valid, otherwise fetches from TMDb and caches automatically',
  })
  @ApiParam({ name: 'tmdbId', description: 'TMDb movie ID', example: 550, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Movie data with source indicator',
    example: { source: 'cache', data: { tmdbId: 550, title: 'Fight Club' } },
  })
  async getMovieHybrid(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ): Promise<{ source: string; data: MediaCache | TmdbMovieDetails }> {
    const cached = await this.mediaCacheService.getCachedMedia(tmdbId, 'movie');
    if (cached && (await this.mediaCacheService.isCacheValid(tmdbId, 'movie'))) {
      return { source: 'cache', data: cached };
    }

    const movieDetails = await this.tmdbService.getMovieDetails(tmdbId);
    await this.mediaCacheService.saveMovieToCache(movieDetails);

    return { source: 'tmdb', data: movieDetails };
  }

  @Get('hybrid/tv/:tmdbId')
  @ApiOperation({
    summary: 'Get TV show (hybrid: cache-first strategy)',
    description:
      'Returns TV show from cache if valid, otherwise fetches from TMDb and caches automatically',
  })
  @ApiParam({ name: 'tmdbId', description: 'TMDb TV show ID', example: 1396, type: Number })
  @ApiResponse({
    status: 200,
    description: 'TV show data with source indicator',
    example: { source: 'cache', data: { tmdbId: 1396, title: 'Breaking Bad' } },
  })
  async getTVShowHybrid(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ): Promise<{ source: string; data: MediaCache | TmdbTVShowDetails }> {
    const cached = await this.mediaCacheService.getCachedMedia(tmdbId, 'tv');
    if (cached && (await this.mediaCacheService.isCacheValid(tmdbId, 'tv'))) {
      return { source: 'cache', data: cached };
    }

    const tvDetails = await this.tmdbService.getTVShowDetails(tmdbId);
    await this.mediaCacheService.saveTVShowToCache(tvDetails);

    return { source: 'tmdb', data: tvDetails };
  }
}
