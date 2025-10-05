import { Injectable, Inject } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { UserMatch, UserSwipe } from './user-match.model';

@Injectable()
export class MatchesService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  private get matchesCollection() {
    return this.firestore.collection('userMatches');
  }

  private get swipesCollection() {
    return this.firestore.collection('userSwipes');
  }

  async createMatch(userId1: string, userId2: string, movieId: number): Promise<UserMatch> {
    const matchData: Omit<UserMatch, 'id'> = {
      users: [userId1, userId2],
      movieId,
      matchedAt: Timestamp.now(),
      isActive: true,
    };

    const docRef = await this.matchesCollection.add(matchData);
    return { id: docRef.id, ...matchData };
  }

  async getUserMatches(userId: string): Promise<UserMatch[]> {
    const snapshot = await this.matchesCollection
      .where('users', 'array-contains', userId)
      .where('isActive', '==', true)
      .orderBy('matchedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserMatch[];
  }

  async getMatchById(matchId: string): Promise<UserMatch | null> {
    const doc = await this.matchesCollection.doc(matchId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as UserMatch;
  }

  async deleteMatch(matchId: string): Promise<void> {
    await this.matchesCollection.doc(matchId).update({
      isActive: false,
      deletedAt: Timestamp.now(),
    });
  }

  async recordSwipe(userId: string, movieId: number, liked: boolean): Promise<UserSwipe> {
    const swipeData: Omit<UserSwipe, 'id'> = {
      userId,
      movieId,
      liked,
      swipedAt: Timestamp.now(),
    };

    const docRef = await this.swipesCollection.add(swipeData);
    return { id: docRef.id, ...swipeData };
  }

  async checkMutualLike(userId1: string, userId2: string, movieId: number): Promise<boolean> {
    const [user1Swipe, user2Swipe] = await Promise.all([
      this.swipesCollection
        .where('userId', '==', userId1)
        .where('movieId', '==', movieId)
        .where('liked', '==', true)
        .limit(1)
        .get(),
      this.swipesCollection
        .where('userId', '==', userId2)
        .where('movieId', '==', movieId)
        .where('liked', '==', true)
        .limit(1)
        .get(),
    ]);

    return !user1Swipe.empty && !user2Swipe.empty;
  }
}
