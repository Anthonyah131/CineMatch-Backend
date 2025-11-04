import { Module } from '@nestjs/common';
import { MediaLogsService } from './media-logs.service';
import { MediaLogsController } from './media-logs.controller';
import { FirebaseModule } from '../../config/firebase.module';
import { MediaCacheModule } from '../media-cache/media-cache.module';
import { TmdbModule } from '../tmdb/tmdb.module';

/**
 * Media Logs Module
 * Handles user viewing logs for movies and TV shows
 *
 * Features:
 * - Log movie/TV viewing events
 * - Track ratings (0-5 stars) and reviews
 * - View history and statistics
 * - User-specific media logs
 * - Automatic media caching from TMDb
 */
@Module({
  imports: [FirebaseModule, MediaCacheModule, TmdbModule],
  controllers: [MediaLogsController],
  providers: [MediaLogsService],
  exports: [MediaLogsService],
})
export class MediaLogsModule {}
