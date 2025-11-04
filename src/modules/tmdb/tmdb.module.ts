import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';

/**
 * TMDB Module
 *
 * Integrates with The Movie Database (TMDb) API for movie and TV show data.
 * Provides access to movie search, details, trending content, and metadata.
 *
 * Features:
 * - Movie search and discovery
 * - Detailed movie information
 * - TV show search and data
 * - Trending and popular content
 * - Movie credits and cast information
 * - Streaming provider availability
 * - Genre listings
 * - TMDb API configuration
 *
 * @module TmdbModule
 */
@Module({
  imports: [HttpModule],
  controllers: [TmdbController],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
