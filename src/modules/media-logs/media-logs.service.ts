import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { MediaLog, UserMediaStats } from './media-log.model';
import type { LogMediaViewDto } from './dto/log-media-view.dto';
import type { UpdateMediaLogDto } from './dto/update-media-log.dto';
import { MediaCacheService } from '../media-cache/media-cache.service';
import { TmdbService } from '../tmdb/tmdb.service';

/**
 * Service for managing user media viewing logs
 *
 * Handles user viewing history with automatic TMDb caching integration.
 * Provides CRUD operations with owner-only permissions and viewing statistics.
 *
 * @remarks
 * - Automatically caches media from TMDb when logging views
 * - Enforces owner-only access for all operations
 * - Maintains real-time viewing statistics
 */
@Injectable()
export class MediaLogsService {
  constructor(
    @Inject('FIRESTORE') private firestore: Firestore,
    private readonly mediaCacheService: MediaCacheService,
    private readonly tmdbService: TmdbService,
  ) {}

  /**
   * Ensure media exists in cache, fetching from TMDb if needed
   *
   * Private helper that checks if media is cached and creates cache entry if missing.
   * Prevents duplicate TMDb API calls by checking cache first.
   *
   * @param tmdbId - TMDb ID of the media
   * @param mediaType - Type of media (movie or tv)
   * @returns Promise that resolves when media is cached
   * @throws HttpException if TMDb API call fails or media not found
   *
   * @private
   */
  private async ensureMediaInCache(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<void> {
    // Check if already cached
    const cached = await this.mediaCacheService.getCachedMedia(tmdbId, mediaType);
    if (cached) {
      return; // Already cached
    }

    // Fetch from TMDb and cache it
    if (mediaType === 'movie') {
      const movieDetails = await this.tmdbService.getMovieDetails(tmdbId);
      await this.mediaCacheService.saveMovieToCache(movieDetails);
    } else {
      // For TV shows, fetch and cache
      const tvDetails = await this.tmdbService.getTVShowDetails(tmdbId);
      await this.mediaCacheService.saveTVShowToCache(tvDetails);
    }
  }

  /**
   * Log a new media viewing event
   *
   * Creates a new viewing log and automatically caches the media from TMDb if not already cached.
   * Updates user statistics after successful log creation.
   *
   * @param userId - User ID logging the view
   * @param logData - Viewing log data including rating, review, and viewing details
   * @returns Created log with generated Firestore ID
   * @throws HttpException if TMDb media not found or API fails
   *
   * @example
   * ```typescript
   * const log = await logMediaView('user123', {
   *   tmdbId: 550,
   *   mediaType: 'movie',
   *   hadSeenBefore: false,
   *   rating: 4.5,
   *   review: 'Great movie!'
   * });
   * ```
   */
  async logMediaView(userId: string, logData: LogMediaViewDto): Promise<MediaLog & { id: string }> {
    // Ensure media is cached before logging
    await this.ensureMediaInCache(logData.tmdbId, logData.mediaType);

    const logRef = this.firestore.collection('media_logs').doc();

    // Build log object with required fields
    const newLog: Partial<MediaLog> = {
      userId,
      tmdbId: logData.tmdbId,
      mediaType: logData.mediaType,
      watchedAt: Timestamp.now(),
      hadSeenBefore: logData.hadSeenBefore,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (logData.rating !== undefined) {
      newLog.rating = logData.rating;
    }
    if (logData.review !== undefined) {
      newLog.review = logData.review;
    }
    if (logData.reviewLang !== undefined) {
      newLog.reviewLang = logData.reviewLang;
    }
    if (logData.notes !== undefined) {
      newLog.notes = logData.notes;
    }

    await logRef.set(newLog as MediaLog);

    // Update user statistics
    await this.updateUserStats(userId);

    return { id: logRef.id, ...newLog } as unknown as MediaLog & { id: string };
  }

  /**
   * Get all logs for a specific user
   *
   * Retrieves viewing logs ordered by most recent first.
   * Supports pagination with configurable limit.
   *
   * @param userId - User ID to fetch logs for
   * @param limit - Maximum number of logs to return (default: 50)
   * @returns Array of media logs with Firestore IDs, ordered by watchedAt DESC
   */
  async getUserLogs(userId: string, limit: number = 50): Promise<Array<MediaLog & { id: string }>> {
    const snapshot = await this.firestore
      .collection('media_logs')
      .where('userId', '==', userId)
      .orderBy('watchedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Array<MediaLog & { id: string }>;
  }

  /**
   * Get viewing logs for a specific media by user
   *
   * Useful for viewing history of rewatches and rating changes over time.
   * Returns all logs for a specific movie/TV show by a user.
   *
   * @param userId - User ID to fetch logs for
   * @param tmdbId - TMDb ID of the media
   * @param mediaType - Type of media (movie or tv)
   * @returns Array of logs for that media, ordered by watchedAt DESC
   */
  async getUserMediaLogs(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'tv',
  ): Promise<Array<MediaLog & { id: string }>> {
    const snapshot = await this.firestore
      .collection('media_logs')
      .where('userId', '==', userId)
      .where('tmdbId', '==', tmdbId)
      .where('mediaType', '==', mediaType)
      .orderBy('watchedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Array<MediaLog & { id: string }>;
  }

  /**
   * Get a specific log by ID with owner verification
   *
   * Retrieves a single log with permission check.
   * Only the log owner can access their logs.
   *
   * @param logId - Firestore document ID of the log
   * @param currentUserId - Current user ID for permission check
   * @returns Media log with ID
   * @throws NotFoundException if log doesn't exist
   * @throws ForbiddenException if user doesn't own the log
   */
  async getLogById(logId: string, currentUserId: string): Promise<MediaLog & { id: string }> {
    const doc = await this.firestore.collection('media_logs').doc(logId).get();

    if (!doc.exists) {
      throw new NotFoundException('Log no encontrado');
    }

    const log = doc.data() as MediaLog;

    // Only the owner can view their logs
    if (log.userId !== currentUserId) {
      throw new ForbiddenException('No tienes permiso para ver este log');
    }

    return { id: doc.id, ...log } as unknown as MediaLog & { id: string };
  }

  /**
   * Update a media log with owner verification
   *
   * Allows updating rating, review, reviewLang, and notes.
   * Core log data (userId, tmdbId, mediaType, watchedAt) cannot be changed.
   * Automatically updates the updatedAt timestamp.
   *
   * @param logId - Firestore document ID of the log
   * @param userId - User ID (must match log owner)
   * @param updateData - Partial update data (rating, review, notes)
   * @returns Updated log with new data
   * @throws NotFoundException if log doesn't exist
   * @throws ForbiddenException if user doesn't own the log
   */
  async updateLog(
    logId: string,
    userId: string,
    updateData: UpdateMediaLogDto,
  ): Promise<MediaLog & { id: string }> {
    // Build updates object first, excluding undefined values
    const updates: Partial<MediaLog> = {};

    // Only add fields that have values
    if (updateData.rating !== undefined) {
      updates.rating = updateData.rating;
    }
    if (updateData.review !== undefined) {
      updates.review = updateData.review;
    }
    if (updateData.reviewLang !== undefined) {
      updates.reviewLang = updateData.reviewLang;
    }
    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes;
    }

    // Check if there are any fields to update
    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Debes proporcionar al menos un campo para actualizar');
    }

    const logRef = this.firestore.collection('media_logs').doc(logId);
    const doc = await logRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Log no encontrado');
    }

    const log = doc.data() as MediaLog;

    if (log.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este log');
    }

    // Add updatedAt timestamp
    updates.updatedAt = Timestamp.now();

    await logRef.update(updates);

    const updatedDoc = await logRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as unknown as MediaLog & { id: string };
  }

  /**
   * Delete a media log with owner verification
   *
   * Permanently removes the log and updates user statistics.
   * Only the log owner can delete their logs.
   *
   * @param logId - Firestore document ID of the log
   * @param userId - User ID (must match log owner)
   * @returns Promise that resolves when deletion is complete
   * @throws NotFoundException if log doesn't exist
   * @throws ForbiddenException if user doesn't own the log
   */
  async deleteLog(logId: string, userId: string): Promise<void> {
    const logRef = this.firestore.collection('media_logs').doc(logId);
    const doc = await logRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Log no encontrado');
    }

    const log = doc.data() as MediaLog;

    if (log.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este log');
    }

    await logRef.delete();

    // Update user statistics
    await this.updateUserStats(userId);
  }

  /**
   * Get comprehensive media viewing statistics for a user
   *
   * Calculates aggregated statistics from all user logs:
   * - Total unique movies and TV shows watched
   * - Total viewing events (including rewatches)
   * - Total reviews written
   * - Average rating across all rated content
   * - Most recent viewing timestamp
   *
   * @param userId - User ID to calculate stats for
   * @returns Aggregated viewing statistics
   *
   * @remarks
   * Statistics are calculated on-demand by querying all user logs.
   * Consider caching or periodic updates for high-traffic scenarios.
   */
  async getUserStats(userId: string): Promise<UserMediaStats> {
    const snapshot = await this.firestore
      .collection('media_logs')
      .where('userId', '==', userId)
      .get();

    const logs = snapshot.docs.map((doc) => doc.data() as MediaLog);

    const moviesWatched = new Set(
      logs.filter((log) => log.mediaType === ('movie' as any)).map((log) => log.tmdbId),
    ).size;

    const tvShowsWatched = new Set(
      logs.filter((log) => log.mediaType === ('tv' as any)).map((log) => log.tmdbId),
    ).size;

    const totalViews = logs.length;
    const totalReviews = logs.filter((log) => log.review).length;

    const ratingsSum = logs.reduce((sum, log) => sum + (log.rating || 0), 0);
    const ratedLogsCount = logs.filter(
      (log) => log.rating !== undefined && log.rating !== null,
    ).length;
    const averageRating = ratedLogsCount > 0 ? ratingsSum / ratedLogsCount : 0;

    const lastWatchedAt: Timestamp | undefined =
      logs.length > 0
        ? logs.reduce(
            (latest: Timestamp, log) =>
              log.watchedAt.toMillis() > latest.toMillis() ? log.watchedAt : latest,
            logs[0].watchedAt,
          )
        : undefined;

    return {
      totalMoviesWatched: moviesWatched,
      totalTvShowsWatched: tvShowsWatched,
      totalViews,
      totalReviews,
      averageRating: ratedLogsCount > 0 ? Math.round(averageRating * 10) / 10 : 0,
      lastWatchedAt,
    };
  }

  /**
   * Update user statistics (internal helper)
   *
   * Triggers statistics recalculation after log creation/deletion.
   * Currently calculates on-demand; could be optimized with separate stats collection.
   *
   * @param userId - User ID to update stats for
   * @returns Promise that resolves when stats are calculated
   * @private
   */
  private async updateUserStats(userId: string): Promise<void> {
    // This could be optimized with a separate stats collection
    // For now, we calculate on-demand
    await this.getUserStats(userId);
  }
}
