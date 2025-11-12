import { Injectable, Inject } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { PotentialMatch, MatchesResponse, MatchFilters } from './user-match.model';
import type { MediaLog } from '../media-logs/media-log.model';

@Injectable()
export class MatchesService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  private get mediaLogsCollection() {
    return this.firestore.collection('media_logs');
  }

  private get usersCollection() {
    return this.firestore.collection('users');
  }

  /**
   * Find potential matches for a user based on recently watched movies
   * @param userId - Current user's UID
   * @param filters - Optional filters for matches
   * @returns List of potential matches
   */
  async findPotentialMatches(userId: string, filters: MatchFilters = {}): Promise<MatchesResponse> {
    const { maxDaysAgo = 30, minRating = 0, limit = 50 } = filters;

    // Calculate the cutoff date for "recent" viewings
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDaysAgo);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    // 1. Get current user's recent movie views
    const myRecentMovies = await this.getRecentMovies(userId, cutoffTimestamp);

    if (myRecentMovies.length === 0) {
      return { matches: [], total: 0 };
    }

    // 2. Find other users who watched the same movies recently
    const potentialMatches: PotentialMatch[] = [];

    // Query for each movie (Firestore doesn't support array-contains with IN operator efficiently)
    for (const myLog of myRecentMovies) {
      const otherUsersLogs = await this.mediaLogsCollection
        .where('tmdbId', '==', myLog.tmdbId)
        .where('mediaType', '==', 'movie')
        .where('watchedAt', '>=', cutoffTimestamp)
        .get();

      for (const doc of otherUsersLogs.docs) {
        const otherLog = doc.data() as MediaLog;

        // Skip if it's the same user
        if (otherLog.userId === userId) {
          continue;
        }

        // Apply rating filter if specified
        if (minRating > 0 && (!otherLog.rating || otherLog.rating < minRating)) {
          continue;
        }

        // NEW: Check rating compatibility (±1 star difference)
        // If both users rated the movie, their ratings should be similar
        if (myLog.rating && otherLog.rating) {
          const ratingDifference = Math.abs(myLog.rating - otherLog.rating);
          if (ratingDifference > 1) {
            continue; // Skip if ratings differ by more than 1 star
          }
        }

        // Check if we already have a match with this user for this movie
        const existingMatch = potentialMatches.find(
          (m) => m.userId === otherLog.userId && m.movieId === myLog.tmdbId,
        );

        if (existingMatch) {
          continue;
        }

        // Get user info
        const userDoc = await this.usersCollection.doc(otherLog.userId).get();
        const userData = userDoc.data() as { displayName?: string; photoURL?: string } | undefined;

        // Calculate days ago
        const daysAgo = Math.floor(
          (Date.now() - otherLog.watchedAt.toMillis()) / (1000 * 60 * 60 * 24),
        );

        // Get movie info from media cache
        const movieCache = await this.firestore
          .collection('media_cache')
          .doc(`movie_${myLog.tmdbId}`)
          .get();
        const movieData = movieCache.data() as { title?: string; posterPath?: string } | undefined;

        potentialMatches.push({
          userId: otherLog.userId,
          displayName: userData?.displayName,
          photoURL: userData?.photoURL,
          movieId: myLog.tmdbId,
          movieTitle: movieData?.title,
          moviePosterPath: movieData?.posterPath,
          theirWatchedAt: otherLog.watchedAt,
          myWatchedAt: myLog.watchedAt,
          daysAgo,
          myRating: myLog.rating,
          theirRating: otherLog.rating,
        });
      }
    }

    // Sort by most recent first
    potentialMatches.sort((a, b) => a.daysAgo - b.daysAgo);

    // Apply limit
    const limitedMatches = potentialMatches.slice(0, limit);

    return {
      matches: limitedMatches,
      total: potentialMatches.length,
    };
  }

  /**
   * Get recent movie viewings for a user
   * @param userId - User's UID
   * @param cutoffTimestamp - Only return movies watched after this timestamp
   * @returns Array of recent media logs
   */
  private async getRecentMovies(userId: string, cutoffTimestamp: Timestamp): Promise<MediaLog[]> {
    const snapshot = await this.mediaLogsCollection
      .where('userId', '==', userId)
      .where('mediaType', '==', 'movie')
      .where('watchedAt', '>=', cutoffTimestamp)
      .orderBy('watchedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as unknown as MediaLog;
    });
  }

  /**
   * Get matches for a specific movie
   * Find all users who watched the same movie recently
   * @param userId - Current user's UID
   * @param movieId - TMDB movie ID
   * @param maxDaysAgo - Maximum days ago to consider
   * @returns List of users who watched this movie
   */
  async getMatchesForMovie(
    userId: string,
    movieId: number,
    maxDaysAgo = 30,
  ): Promise<PotentialMatch[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDaysAgo);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    // Check if current user has watched this movie
    const myLog = await this.mediaLogsCollection
      .where('userId', '==', userId)
      .where('tmdbId', '==', movieId)
      .where('mediaType', '==', 'movie')
      .orderBy('watchedAt', 'desc')
      .limit(1)
      .get();

    if (myLog.empty) {
      return [];
    }

    const myWatchedAt = (myLog.docs[0].data() as MediaLog).watchedAt;

    // Find other users who watched this movie
    const otherUsersLogs = await this.mediaLogsCollection
      .where('tmdbId', '==', movieId)
      .where('mediaType', '==', 'movie')
      .where('watchedAt', '>=', cutoffTimestamp)
      .get();

    const matches: PotentialMatch[] = [];

    for (const doc of otherUsersLogs.docs) {
      const log = doc.data() as MediaLog;

      if (log.userId === userId) {
        continue;
      }

      const userDoc = await this.usersCollection.doc(log.userId).get();
      const userData = userDoc.data() as { displayName?: string; photoURL?: string } | undefined;

      const daysAgo = Math.floor((Date.now() - log.watchedAt.toMillis()) / (1000 * 60 * 60 * 24));

      // Get movie info
      const movieCache = await this.firestore
        .collection('media_cache')
        .doc(`movie_${movieId}`)
        .get();
      const movieData = movieCache.data() as { title?: string; posterPath?: string } | undefined;

      matches.push({
        userId: log.userId,
        displayName: userData?.displayName,
        photoURL: userData?.photoURL,
        movieId: movieId,
        movieTitle: movieData?.title,
        moviePosterPath: movieData?.posterPath,
        theirWatchedAt: log.watchedAt,
        myWatchedAt: myWatchedAt,
        daysAgo,
      });
    }

    // Sort by most recent first
    matches.sort((a, b) => a.daysAgo - b.daysAgo);

    return matches;
  }
}
