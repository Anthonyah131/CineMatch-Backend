import { Timestamp } from 'firebase-admin/firestore';

/**
 * Base interface for Firestore documents with common timestamp fields
 */
export interface BaseDocument {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Common media information from TMDB
 */
export interface MediaInfo {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string;
}

/**
 * User settings configuration
 */
export interface UserSettings {
  language: string;
  region: string;
  profilePublic: boolean;
}

/**
 * Reaction map for posts, messages, etc.
 */
export interface Reactions {
  [uid: string]: string; // uid -> reaction emoji
}

/**
 * Match status enum
 */
export enum MatchStatus {
  WAITING = 'waiting',
  LIVE = 'live',
  FINISHED = 'finished',
}

/**
 * Message type enum
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

/**
 * Media type enum
 */
export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv',
}
