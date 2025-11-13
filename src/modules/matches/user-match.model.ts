import { Timestamp } from 'firebase-admin/firestore';

/**
 * Potential match between two users based on a movie they both watched recently
 * This is computed on-the-fly, not stored in database
 */
export interface PotentialMatch {
  /** The other user's UID */
  userId: string;
  /** User's display name */
  displayName?: string;
  /** User's photo URL */
  photoURL?: string;
  /** TMDB ID of the movie that both users watched */
  movieId: number;
  /** Movie title */
  movieTitle?: string;
  /** Movie poster path */
  moviePosterPath?: string;
  /** When the other user watched it */
  theirWatchedAt: Timestamp;
  /** When the current user watched it */
  myWatchedAt: Timestamp;
  /** How many days ago they watched it (for sorting/filtering) */
  daysAgo: number;
  /** My rating for the movie */
  myRating?: number;
  /** Their rating for the movie */
  theirRating?: number;
}

/**
 * Response interface for getting potential matches
 */
export interface MatchesResponse {
  /** Array of potential matches */
  matches: PotentialMatch[];
  /** Total number of matches found */
  total: number;
}

/**
 * Query parameters for filtering matches
 */
export interface MatchFilters {
  /** Maximum days ago to consider a viewing as "recent" (default: 30) */
  maxDaysAgo?: number;
  /** Minimum rating the other user gave (1-5, optional) */
  minRating?: number;
  /** Limit number of results */
  limit?: number;
}
