import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument, MediaInfo } from '../../models/base.model';

/**
 * User media item interface (subcollection per user: user_media/{uid}/items/{itemId})
 */
export interface UserMediaItem extends MediaInfo, BaseDocument {
  watched: boolean;
  watchedAt?: Timestamp;
  timesSeen: number;
  rating?: number; // 1-10 scale
  review?: string;
  reviewLang?: string; // ISO 639-1 language code
  // Inherits tmdbId, mediaType, title, posterPath from MediaInfo
  // Inherits createdAt, updatedAt from BaseDocument
}

/**
 * DTO for creating/updating user media item
 */
export interface CreateUserMediaDto extends MediaInfo {
  watched?: boolean;
  rating?: number;
  review?: string;
  reviewLang?: string;
}

/**
 * DTO for updating user media item
 */
export interface UpdateUserMediaDto {
  watched?: boolean;
  watchedAt?: Timestamp;
  rating?: number;
  review?: string;
  reviewLang?: string;
}

/**
 * DTO for marking media as watched
 */
export interface MarkAsWatchedDto {
  rating?: number;
  review?: string;
  reviewLang?: string;
}

/**
 * User media statistics
 */
export interface UserMediaStats {
  totalWatched: number;
  totalMovies: number;
  totalTvShows: number;
  averageRating: number;
  totalReviews: number;
  lastWatchedAt?: Timestamp;
}
