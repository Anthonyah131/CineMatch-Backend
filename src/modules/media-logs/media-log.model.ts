import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument } from '../../models/base.model';

/**
 * Media log interface
 * Collection: media_logs/{logId}
 * Represents a viewing event of a movie/series by a user
 */
export interface MediaLog extends BaseDocument {
  // User identification
  userId: string;

  // Media identification (references media_cache)
  tmdbId: number;
  mediaType: 'movie' | 'tv';

  // Viewing information
  watchedAt: Timestamp; // When the user watched it
  hadSeenBefore: boolean; // If the user had seen it before this log

  // Rating and review (0-5 stars)
  rating?: number; // 0 to 5, can be decimals (e.g., 4.5)
  review?: string; // User's written review
  reviewLang?: string; // ISO 639-1 language code

  // Additional metadata
  notes?: string; // Personal notes about the viewing

  // Inherits createdAt, updatedAt from BaseDocument
}

/**
 * Media log statistics for a user
 */
export interface UserMediaStats {
  totalMoviesWatched: number;
  totalTvShowsWatched: number;
  totalViews: number;
  totalReviews: number;
  averageRating: number;
  lastWatchedAt?: Timestamp;
}
