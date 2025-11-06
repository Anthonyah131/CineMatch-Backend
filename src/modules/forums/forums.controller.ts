import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { ForumsService } from './forums.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateForumDto,
  UpdateForumDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  AddReactionDto,
} from './dto';
import type {
  Forum,
  Post as ForumPost,
  Comment,
  PostWithAuthor,
  CommentWithAuthor,
  ForumSummary,
} from './forum.model';

// Response DTOs for Swagger
export class ForumResponseDto {
  @ApiProperty({ example: 'forum123' })
  id: string;

  @ApiProperty({ example: 'user123' })
  ownerId: string;

  @ApiProperty({ example: 'Movies about Time Travel' })
  title: string;

  @ApiProperty({ example: 'Discuss your favorite time travel movies' })
  description: string;

  @ApiProperty()
  createdAt: any;

  @ApiProperty()
  updatedAt: any;
}

export class ForumSummaryResponseDto {
  @ApiProperty({ example: 'forum123' })
  forumId: string;

  @ApiProperty({ example: 'Movies about Time Travel' })
  title: string;

  @ApiProperty({ example: 'Discuss your favorite time travel movies' })
  description: string;

  @ApiProperty({ example: 'user123' })
  ownerId: string;

  @ApiProperty({ example: 'John Doe' })
  ownerDisplayName: string;

  @ApiProperty({ example: 42 })
  postsCount: number;

  @ApiProperty({ required: false })
  lastPostAt?: any;
}

export class PostResponseDto {
  @ApiProperty({ example: 'post123' })
  id: string;

  @ApiProperty({ example: 'user123' })
  authorId: string;

  @ApiProperty({ example: 'What is your favorite time travel movie?' })
  content: string;

  @ApiProperty({ example: { user456: '👍', user789: '❤️' } })
  reactions: Record<string, string>;

  @ApiProperty()
  createdAt: any;
}

export class PostWithAuthorResponseDto extends PostResponseDto {
  @ApiProperty({ example: 'John Doe' })
  authorDisplayName: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  authorPhotoURL: string;

  @ApiProperty({ example: 15 })
  commentsCount: number;
}

export class CommentResponseDto {
  @ApiProperty({ example: 'comment123' })
  id: string;

  @ApiProperty({ example: 'user456' })
  authorId: string;

  @ApiProperty({ example: 'Interstellar is my favorite!' })
  content: string;

  @ApiProperty()
  createdAt: any;
}

export class CommentWithAuthorResponseDto extends CommentResponseDto {
  @ApiProperty({ example: 'Jane Smith' })
  authorDisplayName: string;

  @ApiProperty({ example: 'https://example.com/photo2.jpg' })
  authorPhotoURL: string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

@ApiTags('forums')
@ApiBearerAuth()
@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  // ==================== FORUMS ====================

  @Post()
  @ApiOperation({
    summary: 'Create a new forum',
    description: 'Create a discussion forum. The owner will be the authenticated user.',
  })
  @ApiBody({ type: CreateForumDto })
  @ApiResponse({
    status: 201,
    description: 'Forum created successfully',
    type: ForumResponseDto,
  })
  async createForum(
    @CurrentUser('uid') userId: string,
    @Body() createForumDto: CreateForumDto,
  ): Promise<Forum & { id: string }> {
    return this.forumsService.createForum(userId, createForumDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all forums',
    description: 'Get a list of all forums with summary information',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of forums to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Forums retrieved successfully',
    type: [ForumSummaryResponseDto],
  })
  async getAllForums(@Query('limit') limit?: string): Promise<ForumSummary[]> {
    return this.forumsService.getAllForums(limit ? parseInt(limit) : undefined);
  }

  @Get(':forumId')
  @ApiOperation({
    summary: 'Get forum by ID',
    description: 'Get detailed information about a specific forum',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiResponse({
    status: 200,
    description: 'Forum retrieved successfully',
    type: ForumResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forum not found' })
  async getForumById(@Param('forumId') forumId: string): Promise<Forum & { id: string }> {
    return this.forumsService.getForumById(forumId);
  }

  @Put(':forumId')
  @ApiOperation({
    summary: 'Update forum',
    description: 'Update forum title and/or description',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiBody({ type: UpdateForumDto })
  @ApiResponse({
    status: 200,
    description: 'Forum updated successfully',
    type: ForumResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forum not found' })
  async updateForum(
    @Param('forumId') forumId: string,
    @Body() updateForumDto: UpdateForumDto,
  ): Promise<Forum & { id: string }> {
    return this.forumsService.updateForum(forumId, updateForumDto);
  }

  @Delete(':forumId')
  @ApiOperation({
    summary: 'Delete forum',
    description: 'Delete a forum and all its posts and comments (only for forum owner)',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiResponse({
    status: 200,
    description: 'Forum deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forum not found' })
  async deleteForum(@Param('forumId') forumId: string): Promise<{ success: boolean }> {
    await this.forumsService.deleteForum(forumId);
    return { success: true };
  }

  // ==================== POSTS ====================

  @Post(':forumId/posts')
  @ApiOperation({
    summary: 'Create a post in a forum',
    description:
      'Create a new post in a specific forum. The author will be the authenticated user.',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forum not found' })
  async createPost(
    @CurrentUser('uid') userId: string,
    @Param('forumId') forumId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<ForumPost & { id: string }> {
    return this.forumsService.createPost(forumId, userId, createPostDto);
  }

  @Get(':forumId/posts')
  @ApiOperation({
    summary: 'Get all posts from a forum',
    description: 'Get all posts from a forum with author information',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of posts to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: [PostWithAuthorResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Forum not found' })
  async getForumPosts(
    @Param('forumId') forumId: string,
    @Query('limit') limit?: string,
  ): Promise<(PostWithAuthor & { id: string })[]> {
    return this.forumsService.getForumPosts(forumId, limit ? parseInt(limit) : undefined);
  }

  @Get(':forumId/posts/:postId')
  @ApiOperation({
    summary: 'Get a specific post',
    description: 'Get details of a specific post',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostById(
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
  ): Promise<ForumPost & { id: string }> {
    return this.forumsService.getPostById(forumId, postId);
  }

  @Put(':forumId/posts/:postId')
  @ApiOperation({
    summary: 'Update a post',
    description: 'Update post content (only for post author)',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ForumPost & { id: string }> {
    return this.forumsService.updatePost(forumId, postId, updatePostDto);
  }

  @Delete(':forumId/posts/:postId')
  @ApiOperation({
    summary: 'Delete a post',
    description: 'Delete a post and all its comments (only for post author or forum owner)',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean }> {
    await this.forumsService.deletePost(forumId, postId);
    return { success: true };
  }

  @Post(':forumId/posts/:postId/reactions')
  @ApiOperation({
    summary: 'Add reaction to post',
    description: 'Add or update emoji reaction to a post',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: AddReactionDto })
  @ApiResponse({
    status: 200,
    description: 'Reaction added successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async addReaction(
    @CurrentUser('uid') userId: string,
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
    @Body() body: AddReactionDto,
  ): Promise<{ success: boolean }> {
    await this.forumsService.addReactionToPost(forumId, postId, userId, body.emoji);
    return { success: true };
  }

  @Delete(':forumId/posts/:postId/reactions')
  @ApiOperation({
    summary: 'Remove reaction from post',
    description: 'Remove current user reaction from a post',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Reaction removed successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async removeReaction(
    @CurrentUser('uid') userId: string,
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean }> {
    await this.forumsService.removeReactionFromPost(forumId, postId, userId);
    return { success: true };
  }

  // ==================== COMMENTS ====================

  @Post(':forumId/posts/:postId/comments')
  @ApiOperation({
    summary: 'Add a comment to a post',
    description: 'Create a new comment on a post. The author will be the authenticated user.',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @CurrentUser('uid') userId: string,
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment & { id: string }> {
    return this.forumsService.createComment(forumId, postId, userId, createCommentDto);
  }

  @Get(':forumId/posts/:postId/comments')
  @ApiOperation({
    summary: 'Get all comments from a post',
    description: 'Get all comments with author information',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of comments to return (default: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: [CommentWithAuthorResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostComments(
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
  ): Promise<(CommentWithAuthor & { id: string })[]> {
    return this.forumsService.getPostComments(forumId, postId, limit ? parseInt(limit) : undefined);
  }

  @Delete(':forumId/posts/:postId/comments/:commentId')
  @ApiOperation({
    summary: 'Delete a comment',
    description: 'Delete a comment (only for comment author or forum owner)',
  })
  @ApiParam({ name: 'forumId', description: 'Forum ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('forumId') forumId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ): Promise<{ success: boolean }> {
    await this.forumsService.deleteComment(forumId, postId, commentId);
    return { success: true };
  }
}
