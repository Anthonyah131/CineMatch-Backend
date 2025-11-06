import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument, Reactions } from '../../models/base.model';

/**
 * Main Forum document interface
 */
export interface Forum extends BaseDocument {
  ownerId: string;
  title: string;
  description: string;
}

/**
 * Post document interface (subcollection of forums)
 */
export interface Post {
  authorId: string;
  content: string;
  reactions: Reactions; // uid -> emoji
  createdAt: Timestamp;
}

/**
 * Comment document interface (subcollection of posts)
 */
export interface Comment {
  authorId: string;
  content: string;
  createdAt: Timestamp;
}

/**
 * Post with author information
 */
export interface PostWithAuthor extends Post {
  authorDisplayName: string;
  authorPhotoURL: string;
  commentsCount: number;
}

/**
 * Comment with author information
 */
export interface CommentWithAuthor extends Comment {
  authorDisplayName: string;
  authorPhotoURL: string;
}

/**
 * Forum summary for forum list
 */
export interface ForumSummary {
  forumId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerDisplayName: string;
  postsCount: number;
  lastPostAt?: Timestamp;
}
