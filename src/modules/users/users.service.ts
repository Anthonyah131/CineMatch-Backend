import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { User, FavoriteItem } from './user.model';
import { Follower, Following } from './user-relations.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MediaLogsService } from '../media-logs/media-logs.service';

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('FIRESTORE') private firestore: Firestore,
    private readonly mediaLogsService: MediaLogsService,
  ) {}

  private get collection() {
    return this.firestore.collection('users');
  }

  /**
   * Get a user by UID
   */
  async getUserById(uid: string): Promise<User | null> {
    try {
      const doc = await this.collection.doc(uid).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        createdAt: (data?.createdAt as Timestamp) || Timestamp.now(),
        updatedAt: (data?.updatedAt as Timestamp) || Timestamp.now(),
      } as User;
    } catch (error) {
      throw new Error(`Failed to get user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserById(createUserDto.uid);
      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const now = Timestamp.now();
      const userData: User = {
        displayName: createUserDto.displayName,
        email: createUserDto.email,
        photoURL: createUserDto.photoURL || '',
        bio: createUserDto.bio || '',
        birthdate: createUserDto.birthdate || '',
        favorites: createUserDto.favorites || [],
        followersCount: 0,
        followingCount: 0,
        settings: createUserDto.settings || {
          language: 'en',
          region: 'US',
          profilePublic: true,
        },
        authProviders: createUserDto.authProvider
          ? [
              {
                provider: createUserDto.authProvider.provider,
                providerId: createUserDto.authProvider.providerId,
                linkedAt: now.toDate(),
              },
            ]
          : [],
        emailVerified: createUserDto.emailVerified || false,
        createdAt: now,
        updatedAt: now,
      };

      await this.collection.doc(createUserDto.uid).set(userData);
      return userData;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update a user
   */
  async updateUser(uid: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const userRef = this.collection.doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        throw new NotFoundException('User not found');
      }

      const updateData = {
        ...updateUserDto,
        updatedAt: Timestamp.now(),
      };

      await userRef.update(updateData);

      // Return updated user
      const updatedDoc = await userRef.get();
      return updatedDoc.data() as User;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      const userRef = this.collection.doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        throw new NotFoundException('User not found');
      }

      await userRef.delete();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Add or update auth provider for user
   */
  async addOrUpdateAuthProvider(
    uid: string,
    provider: 'google' | 'facebook' | 'apple' | 'email',
    providerId: string,
  ): Promise<void> {
    try {
      const userRef = this.collection.doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        throw new NotFoundException('User not found');
      }

      const userData = doc.data() as User;
      const existingProviders = userData.authProviders || [];

      // Check if provider already exists
      const providerExists = existingProviders.some((p) => p.provider === provider);

      if (!providerExists) {
        // Add new provider
        await userRef.update({
          authProviders: [
            ...existingProviders,
            {
              provider,
              providerId,
              linkedAt: new Date(),
            },
          ],
          updatedAt: Timestamp.now(),
        });
      }
      // If provider already exists, we don't need to update it
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to add auth provider: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Add a favorite item to user
   */
  async addFavorite(uid: string, favoriteItem: FavoriteItem): Promise<void> {
    try {
      const userRef = this.collection.doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        throw new NotFoundException('User not found');
      }

      const userData = doc.data() as User;
      const existingFavorite = userData.favorites.find(
        (fav) => fav.tmdbId === favoriteItem.tmdbId && fav.mediaType === favoriteItem.mediaType,
      );

      if (existingFavorite) {
        throw new ConflictException('Item already in favorites');
      }

      await userRef.update({
        favorites: [...userData.favorites, { ...favoriteItem, addedAt: new Date() }],
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to add favorite: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get user's favorites list
   */
  async getFavorites(uid: string): Promise<FavoriteItem[]> {
    try {
      const user = await this.getUserById(uid);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Return favorites sorted by addedAt date (newest first)
      return user.favorites.sort((a, b) => {
        const dateA =
          a.addedAt instanceof Date ? a.addedAt.getTime() : new Date(a.addedAt).getTime();
        const dateB =
          b.addedAt instanceof Date ? b.addedAt.getTime() : new Date(b.addedAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get favorites: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get user's public profile with stats
   */
  async getUserProfile(uid: string): Promise<{
    user: Omit<User, 'settings' | 'authProviders' | 'emailVerified'>;
    stats: {
      totalFavorites: number;
      followersCount: number;
      followingCount: number;
    };
    recentFavorites: FavoriteItem[];
  }> {
    try {
      const user = await this.getUserById(uid);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get recent favorites (last 10)
      const recentFavorites = user.favorites
        .sort((a, b) => {
          const dateA =
            a.addedAt instanceof Date ? a.addedAt.getTime() : new Date(a.addedAt).getTime();
          const dateB =
            b.addedAt instanceof Date ? b.addedAt.getTime() : new Date(b.addedAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 10);

      // Return public profile data
      return {
        user: {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          bio: user.bio,
          birthdate: user.birthdate,
          favorites: user.favorites,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats: {
          totalFavorites: user.favorites.length,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
        },
        recentFavorites,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get user profile: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get complete user profile for visiting another user's profile
   * Includes user info, favorites, stats, recent logs, and recent reviews
   */
  async getCompleteUserProfile(uid: string): Promise<{
    user: Omit<User, 'settings' | 'authProviders' | 'emailVerified'>;
    stats: {
      totalFavorites: number;
      followersCount: number;
      followingCount: number;
      totalMoviesWatched: number;
      totalTvShowsWatched: number;
      totalViews: number;
      totalReviews: number;
      averageRating: number;
    };
    recentFavorites: FavoriteItem[];
    recentLogs: any[];
    recentReviews: any[];
  }> {
    try {
      const user = await this.getUserById(uid);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get recent favorites (last 10)
      const recentFavorites = user.favorites
        .sort((a, b) => {
          const dateA =
            a.addedAt instanceof Date ? a.addedAt.getTime() : new Date(a.addedAt).getTime();
          const dateB =
            b.addedAt instanceof Date ? b.addedAt.getTime() : new Date(b.addedAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 10);

      // Get media logs stats and recent activity
      const [mediaStats, recentLogs] = await Promise.all([
        this.mediaLogsService.getUserStats(uid),
        this.mediaLogsService.getUserLogs(uid, 10),
      ]);

      // Extract recent reviews (logs with review content)
      const recentReviews = recentLogs
        .filter((log) => log.review && log.review.trim() !== '')
        .slice(0, 10)
        .map((log) => ({
          id: log.id,
          tmdbId: log.tmdbId,
          mediaType: log.mediaType,
          rating: log.rating,
          review: log.review,
          reviewLang: log.reviewLang,
          watchedAt: log.watchedAt,
          createdAt: log.createdAt,
        }));

      // Return complete profile data
      return {
        user: {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          bio: user.bio,
          birthdate: user.birthdate,
          favorites: user.favorites,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats: {
          totalFavorites: user.favorites.length,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          totalMoviesWatched: mediaStats.totalMoviesWatched,
          totalTvShowsWatched: mediaStats.totalTvShowsWatched,
          totalViews: mediaStats.totalViews,
          totalReviews: mediaStats.totalReviews,
          averageRating: mediaStats.averageRating,
        },
        recentFavorites,
        recentLogs: recentLogs.map((log) => ({
          id: log.id,
          tmdbId: log.tmdbId,
          mediaType: log.mediaType,
          rating: log.rating,
          review: log.review ? log.review.substring(0, 100) + '...' : null, // Preview only
          watchedAt: log.watchedAt,
          hadSeenBefore: log.hadSeenBefore,
        })),
        recentReviews,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get complete user profile: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Remove a favorite item from user
   */
  async removeFavorite(uid: string, tmdbId: number, mediaType: string): Promise<void> {
    try {
      const userRef = this.collection.doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        throw new NotFoundException('User not found');
      }

      const userData = doc.data() as User;
      const updatedFavorites = userData.favorites.filter(
        (fav) => !(fav.tmdbId === tmdbId && fav.mediaType === mediaType),
      );

      await userRef.update({
        favorites: updatedFavorites,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to remove favorite: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Follow a user
   */
  async followUser(followerUid: string, followedUid: string): Promise<void> {
    try {
      if (followerUid === followedUid) {
        throw new ConflictException('Cannot follow yourself');
      }

      // Check if both users exist
      const [followerDoc, followedDoc] = await Promise.all([
        this.collection.doc(followerUid).get(),
        this.collection.doc(followedUid).get(),
      ]);

      if (!followerDoc.exists || !followedDoc.exists) {
        throw new NotFoundException('One or both users not found');
      }

      const now = Timestamp.now();

      // Add to follower's following subcollection
      const followingData: Following = {
        uid: followedUid,
        followedAt: now,
      };

      // Add to followed user's followers subcollection
      const followerData: Follower = {
        uid: followerUid,
        followedAt: now,
      };

      const batch = this.firestore.batch();

      // Update subcollections
      batch.set(
        this.collection.doc(followerUid).collection('following').doc(followedUid),
        followingData,
      );
      batch.set(
        this.collection.doc(followedUid).collection('followers').doc(followerUid),
        followerData,
      );

      // Update counts
      batch.update(this.collection.doc(followerUid), {
        followingCount: (followerDoc.data()?.followingCount || 0) + 1,
        updatedAt: now,
      });
      batch.update(this.collection.doc(followedUid), {
        followersCount: (followedDoc.data()?.followersCount || 0) + 1,
        updatedAt: now,
      });

      await batch.commit();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to follow user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerUid: string, followedUid: string): Promise<void> {
    try {
      const [followerDoc, followedDoc] = await Promise.all([
        this.collection.doc(followerUid).get(),
        this.collection.doc(followedUid).get(),
      ]);

      if (!followerDoc.exists || !followedDoc.exists) {
        throw new NotFoundException('One or both users not found');
      }

      const now = Timestamp.now();
      const batch = this.firestore.batch();

      // Remove from subcollections
      batch.delete(this.collection.doc(followerUid).collection('following').doc(followedUid));
      batch.delete(this.collection.doc(followedUid).collection('followers').doc(followerUid));

      // Update counts
      batch.update(this.collection.doc(followerUid), {
        followingCount: Math.max((followerDoc.data()?.followingCount || 1) - 1, 0),
        updatedAt: now,
      });
      batch.update(this.collection.doc(followedUid), {
        followersCount: Math.max((followedDoc.data()?.followersCount || 1) - 1, 0),
        updatedAt: now,
      });

      await batch.commit();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to unfollow user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get user's followers with user information
   */
  async getFollowers(uid: string, limit: number = 50): Promise<Follower[]> {
    try {
      const snapshot = await this.collection
        .doc(uid)
        .collection('followers')
        .orderBy('followedAt', 'desc')
        .limit(limit)
        .get();

      // Get follower UIDs
      const followerDocs = snapshot.docs.map((doc) => doc.data() as Follower);

      // Fetch user information for each follower
      const followersWithInfo = await Promise.all(
        followerDocs.map(async (follower) => {
          const userDoc = await this.collection.doc(follower.uid).get();
          const userData = userDoc.data() as User | undefined;

          return {
            uid: follower.uid,
            displayName: userData?.displayName || '',
            photoURL: userData?.photoURL || '',
            bio: userData?.bio || '',
            followedAt: follower.followedAt,
          };
        }),
      );

      return followersWithInfo as Follower[];
    } catch (error) {
      throw new Error(`Failed to get followers: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get user's following with user information
   */
  async getFollowing(uid: string, limit: number = 50): Promise<Following[]> {
    try {
      const snapshot = await this.collection
        .doc(uid)
        .collection('following')
        .orderBy('followedAt', 'desc')
        .limit(limit)
        .get();

      // Get following UIDs
      const followingDocs = snapshot.docs.map((doc) => doc.data() as Following);

      // Fetch user information for each followed user
      const followingWithInfo = await Promise.all(
        followingDocs.map(async (following) => {
          const userDoc = await this.collection.doc(following.uid).get();
          const userData = userDoc.data() as User | undefined;

          return {
            uid: following.uid,
            displayName: userData?.displayName || '',
            photoURL: userData?.photoURL || '',
            bio: userData?.bio || '',
            followedAt: following.followedAt,
          };
        }),
      );

      return followingWithInfo as Following[];
    } catch (error) {
      throw new Error(`Failed to get following: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Check if user A follows user B
   */
  async isFollowing(followerUid: string, followedUid: string): Promise<boolean> {
    try {
      const doc = await this.collection
        .doc(followerUid)
        .collection('following')
        .doc(followedUid)
        .get();

      return doc.exists;
    } catch (error) {
      throw new Error(`Failed to check follow status: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Search users by display name
   */
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    try {
      // Note: This is a simple search. For production, consider using Algolia or similar
      const snapshot = await this.collection
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data()) as User[];
    } catch (error) {
      throw new Error(`Failed to search users: ${getErrorMessage(error)}`);
    }
  }
}
