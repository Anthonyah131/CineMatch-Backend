import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { MediaCache } from './media-cache.model';
import type {
  TmdbMovie,
  TmdbMovieDetails,
  TmdbTVShow,
  TmdbTVShowDetails,
} from '../tmdb/tmdb.service';

/**
 * Service for caching TMDb media data locally
 * Reduces external API calls by storing frequently accessed media information
 */
@Injectable()
export class MediaCacheService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  /**
   * Save TMDb movie data to Firestore cache
   * Creates or updates cache entry with 7-day validity
   * @param movie - Movie data from TMDb API
   * @throws Error if movie data is invalid
   */
  async saveMovieToCache(movie: TmdbMovie | TmdbMovieDetails): Promise<void> {
    const mediaKey = `${movie.id}_movie`;

    // Handle genres based on movie type
    let genreIds: number[] = [];
    if ('genre_ids' in movie) {
      genreIds = movie.genre_ids;
    } else {
      const detailsMovie = movie as TmdbMovieDetails;
      if (detailsMovie.genres) {
        genreIds = detailsMovie.genres.map((g: { id: number; name: string }) => g.id);
      }
    }

    const cacheData: MediaCache = {
      tmdbId: movie.id,
      mediaType: 'movie',
      title: movie.title,
      posterPath: movie.poster_path || '',
      releaseYear: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0,
      genres: genreIds,
      voteAverage: movie.vote_average,
      updatedAt: Timestamp.now(),
    };

    await this.firestore.collection('media_cache').doc(mediaKey).set(cacheData);
  }

  /**
   * Save TMDb TV show data to Firestore cache
   * Creates or updates cache entry with 7-day validity
   * @param tvShow - TV show data from TMDb API
   * @throws Error if TV show data is invalid
   */
  async saveTVShowToCache(tvShow: TmdbTVShow | TmdbTVShowDetails): Promise<void> {
    const mediaKey = `${tvShow.id}_tv`;

    // Handle genres based on TV show type
    let genreIds: number[] = [];
    if ('genre_ids' in tvShow) {
      genreIds = tvShow.genre_ids;
    } else {
      const detailsShow = tvShow as TmdbTVShowDetails;
      if (detailsShow.genres) {
        genreIds = detailsShow.genres.map((g) => g.id);
      }
    }

    const cacheData: MediaCache = {
      tmdbId: tvShow.id,
      mediaType: 'tv',
      title: tvShow.name || tvShow.original_name,
      posterPath: tvShow.poster_path || '',
      releaseYear: tvShow.first_air_date ? parseInt(tvShow.first_air_date.substring(0, 4)) : 0,
      genres: genreIds,
      voteAverage: tvShow.vote_average || 0,
      updatedAt: Timestamp.now(),
    };

    await this.firestore.collection('media_cache').doc(mediaKey).set(cacheData);
  }

  /**
   * Get cached media by TMDb ID and type
   * @param tmdbId - TMDb ID of the media
   * @param mediaType - Type of media (movie or tv)
   * @returns Cached media data or null if not found
   */
  async getCachedMedia(
    tmdbId: number,
    mediaType: 'movie' | 'tv' = 'movie',
  ): Promise<MediaCache | null> {
    const mediaKey = `${tmdbId}_${mediaType}`;
    const doc = await this.firestore.collection('media_cache').doc(mediaKey).get();

    return doc.exists ? (doc.data() as MediaCache) : null;
  }

  /**
   * Search cached media by title (case-insensitive)
   * @param query - Search term to match against titles
   * @param mediaType - Optional media type filter
   * @returns Array of matching cached media (max 20 results)
   */
  async searchCachedMedia(query: string, mediaType?: 'movie' | 'tv'): Promise<MediaCache[]> {
    let queryBuilder = this.firestore.collection('media_cache').limit(20);

    if (mediaType) {
      queryBuilder = queryBuilder.where('mediaType', '==', mediaType);
    }

    const snapshot = await queryBuilder.get();
    const results = snapshot.docs.map((doc) => doc.data() as MediaCache);

    // Filter by title similarity (basic search)
    return results.filter((media) => media.title.toLowerCase().includes(query.toLowerCase()));
  }

  /**
   * Get popular cached media sorted by vote average
   * @param mediaType - Type of media to retrieve
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of popular cached media
   */
  async getPopularCachedMedia(
    mediaType: 'movie' | 'tv' = 'movie',
    limit: number = 20,
  ): Promise<MediaCache[]> {
    const snapshot = await this.firestore
      .collection('media_cache')
      .where('mediaType', '==', mediaType)
      .orderBy('voteAverage', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as MediaCache);
  }

  /**
   * Get recently cached media sorted by update timestamp
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of recently cached media
   */
  async getRecentCachedMedia(limit: number = 20): Promise<MediaCache[]> {
    const snapshot = await this.firestore
      .collection('media_cache')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as MediaCache);
  }

  /**
   * Check if media exists in cache and is still valid (less than 7 days old)
   * @param tmdbId - TMDb ID of the media
   * @param mediaType - Type of media (movie or tv)
   * @returns True if cache exists and is valid, false otherwise
   */
  async isCacheValid(tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<boolean> {
    const cached = await this.getCachedMedia(tmdbId, mediaType);
    if (!cached) return false;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return cached.updatedAt.toDate() > weekAgo;
  }

  /**
   * Get cache statistics (total, movies, TV shows)
   * @returns Object with cache counts by type
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    moviesCached: number;
    tvCached: number;
  }> {
    const totalSnapshot = await this.firestore.collection('media_cache').count().get();
    const moviesSnapshot = await this.firestore
      .collection('media_cache')
      .where('mediaType', '==', 'movie')
      .count()
      .get();
    const tvSnapshot = await this.firestore
      .collection('media_cache')
      .where('mediaType', '==', 'tv')
      .count()
      .get();

    return {
      totalCached: totalSnapshot.data().count,
      moviesCached: moviesSnapshot.data().count,
      tvCached: tvSnapshot.data().count,
    };
  }

  /**
   * Delete cached media by TMDb ID
   * @param tmdbId - TMDb ID of the media
   * @param mediaType - Type of media (movie or tv)
   * @throws NotFoundException if media not found in cache
   */
  async deleteCachedMedia(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<void> {
    const mediaKey = `${tmdbId}_${mediaType}`;
    const doc = await this.firestore.collection('media_cache').doc(mediaKey).get();

    if (!doc.exists) {
      throw new NotFoundException('Media no encontrada en caché');
    }

    await this.firestore.collection('media_cache').doc(mediaKey).delete();
  }
}
