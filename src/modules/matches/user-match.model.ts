import { Timestamp } from 'firebase-admin/firestore';

/**
 * User match interface - when two users like the same movie
 */
export interface UserMatch {
  /** Document ID */
  id?: string;
  /** Array of the two user UIDs who matched */
  users: [string, string];
  /** TMDB ID of the movie that caused the match */
  movieId: number;
  /** When the match was created */
  matchedAt: Timestamp;
  /** Whether the match is still active */
  isActive: boolean;
  /** ID of the conversation/chat if started */
  conversationId?: string;
  /** When the match was deleted/unmatched */
  deletedAt?: Timestamp;
}

/**
 * User like/swipe interface
 */
export interface UserSwipe {
  /** Document ID */
  id?: string;
  /** User who performed the swipe */
  userId: string;
  /** TMDB ID of the movie */
  movieId: number;
  /** Whether user liked (true) or passed (false) */
  liked: boolean;
  /** When the swipe happened */
  swipedAt: Timestamp;
}
