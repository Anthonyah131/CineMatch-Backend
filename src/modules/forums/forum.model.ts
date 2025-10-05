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
 * DTO for creating a new forum
 */
export interface CreateForumDto {
  ownerId: string;
  title: string;
  description: string;
}

/**
 * DTO for updating a forum
 */
export interface UpdateForumDto {
  title?: string;
  description?: string;
}

/**
 * DTO for creating a new post
 */
export interface CreatePostDto {
  authorId: string;
  content: string;
}

/**
 * DTO for updating a post
 */
export interface UpdatePostDto {
  content?: string;
}

/**
 * DTO for creating a new comment
 */
export interface CreateCommentDto {
  authorId: string;
  content: string;
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
