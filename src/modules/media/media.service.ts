import { Injectable, Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { MediaType } from '../../models/base.model';
import type { MediaCache } from './media-cache.model';
import type { TmdbMovie, TmdbMovieDetails } from '../tmdb/tmdb.service';

@Injectable()
export class MediaCacheService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  /**
   * Save TMDb movie data to Firestore cache
   */
  async saveToCache(movie: TmdbMovie | TmdbMovieDetails): Promise<void> {
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
      mediaType: MediaType.MOVIE,
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
   * Get cached media by TMDb ID
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
   * Search cached media by title
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
   * Get popular cached media (by vote average)
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
   * Get recently added cached media
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
   * Check if media exists in cache and is recent (less than 7 days old)
   */
  async isCacheValid(tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<boolean> {
    const cached = await this.getCachedMedia(tmdbId, mediaType);
    if (!cached) return false;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return cached.updatedAt.toDate() > weekAgo;
  }

  /**
   * Update cache statistics
   */
  async updateCacheStats(): Promise<{
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

  async cacheMedia(mediaData: MediaCache): Promise<void> {
    await this.firestore.collection('mediaCache').doc(mediaData.tmdbId.toString()).set(mediaData);
  }
}
