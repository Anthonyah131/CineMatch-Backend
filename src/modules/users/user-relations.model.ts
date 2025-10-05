import { Timestamp } from 'firebase-admin/firestore';

/**
 * Follower document interface (subcollection of users)
 * Document ID should be the follower's UID
 */
export interface Follower {
  uid: string; // The UID of the user who is following
  followedAt: Timestamp;
}

/**
 * Following document interface (subcollection of users)
 * Document ID should be the followed user's UID
 */
export interface Following {
  uid: string; // The UID of the user being followed
  followedAt: Timestamp;
}

/**
 * DTO for creating follow relationships
 */
export interface CreateFollowDto {
  followerUid: string;
  followedUid: string;
}

/**
 * Follow relationship status
 */
export interface FollowStatus {
  isFollowing: boolean;
  followedAt?: Timestamp;
}
