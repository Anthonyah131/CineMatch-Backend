import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MediaCacheService } from './media-cache.service';
import { MediaCacheController } from './media-cache.controller';
import { FirebaseModule } from '../../config/firebase.module';
import { TmdbModule } from '../tmdb/tmdb.module';

/**
 * Media Cache Module
 * Caches TMDb API data locally to reduce external API calls
 *
 * Features:
 * - Cache movie and TV show data from TMDb
 * - Hybrid endpoints (cache-first, then TMDb)
 * - Search cached media
 * - Cache statistics
 */
@Module({
  imports: [FirebaseModule, HttpModule, TmdbModule],
  controllers: [MediaCacheController],
  providers: [MediaCacheService],
  exports: [MediaCacheService],
})
export class MediaCacheModule {}
