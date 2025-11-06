import { BaseDocument, MediaType } from '../../models/base.model';

/**
 * Movie Quote document interface
 */
export interface MovieQuote extends BaseDocument {
  text: string;
  language: string; // ISO 639-1 language code
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  character: string;
  difficulty: number; // 1-10 scale (1 = easy, 10 = very hard)
  tags: string[]; // Array of tags for categorization
  approved: boolean; // Admin approval status
}

/**
 * DTO for creating a new movie quote
 */
export interface CreateMovieQuoteDto {
  text: string;
  language: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  character: string;
  difficulty?: number;
  tags?: string[];
}

/**
 * DTO for updating a movie quote
 */
export interface UpdateMovieQuoteDto {
  text?: string;
  language?: string;
  character?: string;
  difficulty?: number;
  tags?: string[];
  approved?: boolean;
}

/**
 * Quote difficulty levels
 */
export enum QuoteDifficulty {
  VERY_EASY = 1,
  EASY = 2,
  NORMAL = 3,
  MEDIUM = 4,
  HARD = 5,
  VERY_HARD = 6,
  EXPERT = 7,
  MASTER = 8,
  LEGENDARY = 9,
  IMPOSSIBLE = 10,
}

/**
 * Quote search filters
 */
export interface QuoteFilters {
  language?: string;
  mediaType?: MediaType;
  difficulty?: number;
  tags?: string[];
  approved?: boolean;
  tmdbId?: number;
}
