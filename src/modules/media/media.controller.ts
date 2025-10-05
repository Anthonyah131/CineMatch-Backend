import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MediaCacheService } from './media.service';
import { TmdbService } from '../tmdb/tmdb.service';
import type { MediaCache } from './media-cache.model';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaCacheService: MediaCacheService,
    private readonly tmdbService: TmdbService,
  ) {}

  @Get('cache/search')
  @ApiOperation({ summary: 'Search in local media cache' })
  @ApiQuery({ name: 'query', required: true, description: 'Search term' })
  @ApiQuery({ name: 'type', required: false, description: 'Media type (movie/tv)' })
  @ApiResponse({ status: 200, description: 'Search results from cache' })
  async searchCachedMedia(
    @Query('query') query: string,
    @Query('type') type?: 'movie' | 'tv',
  ): Promise<MediaCache[]> {
    return this.mediaCacheService.searchCachedMedia(query, type);
  }

  @Get('cache/popular/:mediaType')
  @ApiOperation({ summary: 'Get popular media from cache' })
  @ApiParam({ name: 'mediaType', description: 'Media type (movie/tv)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results limit' })
  @ApiResponse({ status: 200, description: 'Popular media list from cache' })
  async getPopularCachedMedia(
    @Param('mediaType') mediaType: 'movie' | 'tv',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<MediaCache[]> {
    return this.mediaCacheService.getPopularCachedMedia(mediaType, limit);
  }

  @Get('cache/recent')
  @ApiOperation({ summary: 'Get recent media from cache' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results limit' })
  @ApiResponse({ status: 200, description: 'Recent media list from cache' })
  async getRecentCachedMedia(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<MediaCache[]> {
    return this.mediaCacheService.getRecentCachedMedia(limit);
  }

  @Get('cache/:tmdbId/:mediaType')
  @ApiOperation({ summary: 'Get specific media from cache' })
  @ApiParam({ name: 'tmdbId', description: 'TMDb ID' })
  @ApiParam({ name: 'mediaType', description: 'Media type (movie/tv)' })
  @ApiResponse({ status: 200, description: 'Media data from cache' })
  @ApiResponse({ status: 404, description: 'Media not found in cache' })
  async getCachedMedia(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('mediaType') mediaType: 'movie' | 'tv',
  ): Promise<MediaCache | null> {
    return this.mediaCacheService.getCachedMedia(tmdbId, mediaType);
  }

  @Post('cache/save-movie/:tmdbId')
  @ApiOperation({ summary: 'Save TMDb movie to cache' })
  @ApiParam({ name: 'tmdbId', description: 'TMDb movie ID' })
  @ApiResponse({ status: 200, description: 'Movie saved to cache successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found in TMDb' })
  async saveMovieToCache(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ): Promise<{ message: string }> {
    // Check if already cached and valid
    const isCached = await this.mediaCacheService.isCacheValid(tmdbId, 'movie');
    if (isCached) {
      return { message: 'Movie is already cached and valid' };
    }

    // Fetch from TMDb and save to cache
    const movieDetails = await this.tmdbService.getMovieDetails(tmdbId);
    await this.mediaCacheService.saveToCache(movieDetails);

    return { message: 'Movie saved to cache successfully' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  async getCacheStats(): Promise<{ totalCached: number; moviesCached: number; tvCached: number }> {
    return this.mediaCacheService.updateCacheStats();
  }

  // Hybrid endpoints that check cache first, then fetch from TMDb if needed
  @Get('hybrid/movie/:tmdbId')
  @ApiOperation({ summary: 'Get movie (cache first, then TMDb)' })
  @ApiParam({ name: 'tmdbId', description: 'TMDb movie ID' })
  @ApiResponse({ status: 200, description: 'Movie data retrieved successfully' })
  async getMovieHybrid(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    // Check cache first
    const cached = await this.mediaCacheService.getCachedMedia(tmdbId, 'movie');
    if (cached && (await this.mediaCacheService.isCacheValid(tmdbId, 'movie'))) {
      return { source: 'cache', data: cached };
    }

    // Fetch from TMDb if not in cache or expired
    const movieDetails = await this.tmdbService.getMovieDetails(tmdbId);

    // Save to cache for future requests
    await this.mediaCacheService.saveToCache(movieDetails);

    return { source: 'tmdb', data: movieDetails };
  }
}
