import { Timestamp } from 'firebase-admin/firestore';

/**
 * Media cache document interface for storing TMDB data locally
 * Document ID should be tmdbId + mediaType (e.g., "123456_movie")
 */
export interface MediaCache {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  releaseYear: number;
  genres: number[]; // Array of TMDB genre IDs
  voteAverage: number;
  updatedAt: Timestamp;
}

/**
 * DTO for creating/updating media cache
 */
export interface CreateMediaCacheDto {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  releaseYear: number;
  genres: number[];
  voteAverage: number;
  overview?: string;
  backdropPath?: string;
  originalLanguage?: string;
  popularity?: number;
  adult?: boolean;
  runtime?: number;
  budget?: number;
  revenue?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  episodeRunTime?: number[];
  firstAirDate?: string;
  lastAirDate?: string;
  status?: string;
}

/**
 * Media search filters
 */
export interface MediaSearchFilters {
  mediaType?: 'movie' | 'tv';
  genres?: number[];
  releaseYear?: number;
  minVoteAverage?: number;
  maxVoteAverage?: number;
  limit?: number;
}

/**
 * Popular media item for recommendations
 */
export interface PopularMediaItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  voteAverage: number;
  popularity: number;
}
