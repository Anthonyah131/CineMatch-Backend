import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  CreateForumDto,
  UpdateForumDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
} from './dto';
import type {
  Forum,
  Post,
  Comment,
  PostWithAuthor,
  CommentWithAuthor,
  ForumSummary,
} from './forum.model';

@Injectable()
export class ForumsService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  private get forumsCollection() {
    return this.firestore.collection('forums');
  }

  private get usersCollection() {
    return this.firestore.collection('users');
  }

  // ==================== FORUMS ====================

  /**
   * Create a new forum
   */
  async createForum(
    ownerId: string,
    createForumDto: CreateForumDto,
  ): Promise<Forum & { id: string }> {
    const forumData = {
      ownerId,
      ...createForumDto,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await this.forumsCollection.add(forumData);

    return {
      id: docRef.id,
      ...forumData,
    } as Forum & { id: string };
  }

  /**
   * Get all forums with summary information
   */
  async getAllForums(limit = 50): Promise<ForumSummary[]> {
    const snapshot = await this.forumsCollection.orderBy('createdAt', 'desc').limit(limit).get();

    const forums: ForumSummary[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Forum;

      // Get owner info
      const ownerDoc = await this.usersCollection.doc(data.ownerId).get();
      const ownerData = ownerDoc.data() as { displayName?: string } | undefined;

      // Count posts
      const postsSnapshot = await this.forumsCollection
        .doc(doc.id)
        .collection('posts')
        .count()
        .get();

      // Get last post timestamp
      const lastPostSnapshot = await this.forumsCollection
        .doc(doc.id)
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      forums.push({
        forumId: doc.id,
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        ownerDisplayName: ownerData?.displayName || 'Unknown',
        postsCount: postsSnapshot.data().count,
        lastPostAt: !lastPostSnapshot.empty
          ? (lastPostSnapshot.docs[0].data().createdAt as Timestamp)
          : undefined,
      });
    }

    return forums;
  }

  /**
   * Get forums created by a specific user with pagination
   * Returns basic ForumSummary entries
   */
  async getForumsByOwner(
    ownerId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: ForumSummary[]; total: number; page: number; limit: number }> {
    const offset = Math.max(page - 1, 0) * limit;

    // Query forums by ownerId
    const query = this.forumsCollection
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit);

    const [snapshot, countSnapshot] = await Promise.all([
      query.get(),
      this.forumsCollection.where('ownerId', '==', ownerId).count().get(),
    ]);

    const items: ForumSummary[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Forum;

      const ownerDoc = await this.usersCollection.doc(data.ownerId).get();
      const ownerData = ownerDoc.data() as { displayName?: string } | undefined;

      const postsSnapshot = await this.forumsCollection
        .doc(doc.id)
        .collection('posts')
        .count()
        .get();

      const lastPostSnapshot = await this.forumsCollection
        .doc(doc.id)
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      items.push({
        forumId: doc.id,
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        ownerDisplayName: ownerData?.displayName || 'Unknown',
        postsCount: postsSnapshot.data().count,
        lastPostAt: !lastPostSnapshot.empty
          ? (lastPostSnapshot.docs[0].data().createdAt as Timestamp)
          : undefined,
      });
    }

    return { items, total: countSnapshot.data().count, page, limit };
  }

  /**
   * Search forums by title OR owner display name (single input) with pagination
   * Case-insensitive partial match search
   */
  async searchForums(
    queryInput: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: ForumSummary[]; total: number; page: number; limit: number }> {
    const q = queryInput.trim().toLowerCase();
    if (!q) {
      return { items: [], total: 0, page, limit };
    }

    // Fetch all forums and users to perform in-memory filtering
    // Note: For large datasets, consider using a search service like Algolia
    const [forumsSnapshot, usersSnapshot] = await Promise.all([
      this.forumsCollection.get(),
      this.usersCollection.get(),
    ]);

    // Create a map of userId -> displayName (lowercase for case-insensitive search)
    const userDisplayNames = new Map<string, string>();
    const userOriginalNames = new Map<string, string>();
    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data() as { displayName?: string };
      if (data.displayName) {
        userDisplayNames.set(doc.id, data.displayName.toLowerCase());
        userOriginalNames.set(doc.id, data.displayName);
      }
    });

    // Filter forums that match the query in title OR owner displayName
    const matchingDocs = forumsSnapshot.docs.filter((doc) => {
      const data = doc.data() as Forum;
      const titleLower = data.title.toLowerCase();
      const ownerNameLower = userDisplayNames.get(data.ownerId) || '';

      return titleLower.includes(q) || ownerNameLower.includes(q);
    });

    // Sort by createdAt desc
    matchingDocs.sort((a, b) => {
      const aCreated = (a.data().createdAt as Timestamp)?.toMillis() || 0;
      const bCreated = (b.data().createdAt as Timestamp)?.toMillis() || 0;
      return bCreated - aCreated;
    });

    const total = matchingDocs.length;
    const offset = Math.max(page - 1, 0) * limit;
    const pageDocs = matchingDocs.slice(offset, offset + limit);

    const items: ForumSummary[] = [];
    for (const doc of pageDocs) {
      const data = doc.data() as Forum;

      const postsSnapshot = await this.forumsCollection
        .doc(doc.id)
        .collection('posts')
        .count()
        .get();

      const lastPostSnapshot = await this.forumsCollection
        .doc(doc.id)
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      items.push({
        forumId: doc.id,
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        ownerDisplayName: userOriginalNames.get(data.ownerId) || 'Unknown',
        postsCount: postsSnapshot.data().count,
        lastPostAt: !lastPostSnapshot.empty
          ? (lastPostSnapshot.docs[0].data().createdAt as Timestamp)
          : undefined,
      });
    }

    return { items, total, page, limit };
  }

  /**
   * Get forum by ID
   */
  async getForumById(forumId: string): Promise<Forum & { id: string }> {
    const doc = await this.forumsCollection.doc(forumId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Forum with ID ${forumId} not found`);
    }

    return {
      id: doc.id,
      ...(doc.data() as Omit<Forum, 'id'>),
    } as Forum & { id: string };
  }

  /**
   * Update forum
   */
  async updateForum(
    forumId: string,
    updateForumDto: UpdateForumDto,
  ): Promise<Forum & { id: string }> {
    const docRef = this.forumsCollection.doc(forumId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Forum with ID ${forumId} not found`);
    }

    const updateData = {
      ...updateForumDto,
      updatedAt: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updated = await docRef.get();
    return {
      id: updated.id,
      ...(updated.data() as Omit<Forum, 'id'>),
    } as Forum & { id: string };
  }

  /**
   * Delete forum (and all its posts and comments)
   */
  async deleteForum(forumId: string): Promise<void> {
    const docRef = this.forumsCollection.doc(forumId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Forum with ID ${forumId} not found`);
    }

    // Delete all posts and their comments
    const postsSnapshot = await docRef.collection('posts').get();

    for (const postDoc of postsSnapshot.docs) {
      // Delete all comments of this post
      const commentsSnapshot = await postDoc.ref.collection('comments').get();
      const batch = this.firestore.batch();

      commentsSnapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });

      await batch.commit();

      // Delete the post
      await postDoc.ref.delete();
    }

    // Delete the forum
    await docRef.delete();
  }

  // ==================== POSTS ====================

  /**
   * Create a new post in a forum
   */
  async createPost(
    forumId: string,
    authorId: string,
    createPostDto: CreatePostDto,
  ): Promise<Post & { id: string }> {
    const forumDoc = await this.forumsCollection.doc(forumId).get();

    if (!forumDoc.exists) {
      throw new NotFoundException(`Forum with ID ${forumId} not found`);
    }

    const postData: Post = {
      authorId,
      ...createPostDto,
      reactions: {},
      createdAt: Timestamp.now(),
    };

    const docRef = await this.forumsCollection.doc(forumId).collection('posts').add(postData);

    return {
      id: docRef.id,
      ...postData,
    };
  }

  /**
   * Get all posts from a forum with author information
   */
  async getForumPosts(forumId: string, limit = 50): Promise<(PostWithAuthor & { id: string })[]> {
    const forumDoc = await this.forumsCollection.doc(forumId).get();

    if (!forumDoc.exists) {
      throw new NotFoundException(`Forum with ID ${forumId} not found`);
    }

    const snapshot = await this.forumsCollection
      .doc(forumId)
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const posts: (PostWithAuthor & { id: string })[] = [];

    for (const doc of snapshot.docs) {
      const postData = doc.data() as Post;

      // Get author info
      const authorDoc = await this.usersCollection.doc(postData.authorId).get();
      const authorData = authorDoc.data() as
        | { displayName?: string; photoURL?: string }
        | undefined;

      // Count comments
      const commentsSnapshot = await doc.ref.collection('comments').count().get();

      posts.push({
        id: doc.id,
        ...postData,
        authorDisplayName: authorData?.displayName || 'Unknown',
        authorPhotoURL: authorData?.photoURL || '',
        commentsCount: commentsSnapshot.data().count,
      });
    }

    return posts;
  }

  /**
   * Get a single post by ID
   */
  async getPostById(forumId: string, postId: string): Promise<Post & { id: string }> {
    const doc = await this.forumsCollection.doc(forumId).collection('posts').doc(postId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return {
      id: doc.id,
      ...(doc.data() as Post),
    };
  }

  /**
   * Update a post
   */
  async updatePost(
    forumId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post & { id: string }> {
    const docRef = this.forumsCollection.doc(forumId).collection('posts').doc(postId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    await docRef.update({ ...updatePostDto });

    const updated = await docRef.get();
    return {
      id: updated.id,
      ...(updated.data() as Post),
    };
  }

  /**
   * Delete a post (and all its comments)
   */
  async deletePost(forumId: string, postId: string): Promise<void> {
    const docRef = this.forumsCollection.doc(forumId).collection('posts').doc(postId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Delete all comments
    const commentsSnapshot = await docRef.collection('comments').get();
    const batch = this.firestore.batch();

    commentsSnapshot.docs.forEach((commentDoc) => {
      batch.delete(commentDoc.ref);
    });

    await batch.commit();

    // Delete the post
    await docRef.delete();
  }

  /**
   * Add reaction to a post
   */
  async addReactionToPost(
    forumId: string,
    postId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    const docRef = this.forumsCollection.doc(forumId).collection('posts').doc(postId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    await docRef.update({
      [`reactions.${userId}`]: emoji,
    });
  }

  /**
   * Remove reaction from a post
   */
  async removeReactionFromPost(forumId: string, postId: string, userId: string): Promise<void> {
    const docRef = this.forumsCollection.doc(forumId).collection('posts').doc(postId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    await docRef.update({
      [`reactions.${userId}`]: FieldValue.delete(),
    });
  }

  // ==================== COMMENTS ====================

  /**
   * Create a new comment on a post
   */
  async createComment(
    forumId: string,
    postId: string,
    authorId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment & { id: string }> {
    const postDoc = await this.forumsCollection.doc(forumId).collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const commentData: Comment = {
      authorId,
      ...createCommentDto,
      createdAt: Timestamp.now(),
    };

    const docRef = await this.forumsCollection
      .doc(forumId)
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .add(commentData);

    return {
      id: docRef.id,
      ...commentData,
    };
  }

  /**
   * Get all comments from a post with author information
   */
  async getPostComments(
    forumId: string,
    postId: string,
    limit = 100,
  ): Promise<(CommentWithAuthor & { id: string })[]> {
    const postDoc = await this.forumsCollection.doc(forumId).collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const snapshot = await this.forumsCollection
      .doc(forumId)
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get();

    const comments: (CommentWithAuthor & { id: string })[] = [];

    for (const doc of snapshot.docs) {
      const commentData = doc.data() as Comment;

      // Get author info
      const authorDoc = await this.usersCollection.doc(commentData.authorId).get();
      const authorData = authorDoc.data() as
        | { displayName?: string; photoURL?: string }
        | undefined;

      comments.push({
        id: doc.id,
        ...commentData,
        authorDisplayName: authorData?.displayName || 'Unknown',
        authorPhotoURL: authorData?.photoURL || '',
      });
    }

    return comments;
  }

  /**
   * Delete a comment
   */
  async deleteComment(forumId: string, postId: string, commentId: string): Promise<void> {
    const docRef = this.forumsCollection
      .doc(forumId)
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId);

    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    await docRef.delete();
  }
}
