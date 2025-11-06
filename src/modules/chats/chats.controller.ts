import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
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
import { ChatsService } from './chats.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateChatDto, SendMessageDto, AddReactionDto } from './dto';
import type { Chat, Message, ChatSummary, MessageWithSender } from './chat.model';
import { MessageType } from '../../models/base.model';

// Response DTOs for Swagger
export class ChatResponseDto {
  @ApiProperty({ example: 'chat123' })
  id: string;

  @ApiProperty({ example: ['user123', 'user456'] })
  members: string[];

  @ApiProperty({ example: 'Hey! How are you?' })
  lastMessage: string;

  @ApiProperty()
  createdAt: any;

  @ApiProperty()
  updatedAt: any;
}

export class ChatSummaryResponseDto {
  @ApiProperty({ example: 'chat123' })
  chatId: string;

  @ApiProperty({ example: ['user123', 'user456'] })
  members: string[];

  @ApiProperty({ example: 'Hey! How are you?' })
  lastMessage: string;

  @ApiProperty()
  lastMessageAt: any;

  @ApiProperty({ example: 5 })
  unreadCount: number;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'msg123' })
  id: string;

  @ApiProperty({ example: 'user123' })
  senderId: string;

  @ApiProperty({ example: 'What did you think about the movie?' })
  text: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  type: MessageType;

  @ApiProperty({ example: { user456: '👍', user789: '❤️' } })
  reactions: Record<string, string>;

  @ApiProperty()
  createdAt: any;
}

export class MessageWithSenderResponseDto extends MessageResponseDto {
  @ApiProperty({ example: 'John Doe' })
  senderDisplayName: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  senderPhotoURL: string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

@ApiTags('chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  // ==================== CHATS ====================

  @Post()
  @ApiOperation({
    summary: 'Create or get a chat',
    description:
      'Create a new chat with another user or return existing chat. The authenticated user will be automatically added as a member.',
  })
  @ApiBody({ type: CreateChatDto })
  @ApiResponse({
    status: 201,
    description: 'Chat created or retrieved successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Recipient user not found' })
  @ApiResponse({ status: 400, description: 'Cannot create chat with yourself' })
  async createChat(
    @CurrentUser('uid') userId: string,
    @Body() createChatDto: CreateChatDto,
  ): Promise<Chat & { id: string }> {
    return this.chatsService.createOrGetChat(userId, createChatDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user chats',
    description: 'Get all chats for the authenticated user',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of chats to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Chats retrieved successfully',
    type: [ChatSummaryResponseDto],
  })
  async getUserChats(
    @CurrentUser('uid') userId: string,
    @Query('limit') limit?: string,
  ): Promise<ChatSummary[]> {
    return this.chatsService.getUserChats(userId, limit ? parseInt(limit) : undefined);
  }

  @Get(':chatId')
  @ApiOperation({
    summary: 'Get chat by ID',
    description: 'Get detailed information about a specific chat',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat retrieved successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 400, description: 'Not a member of this chat' })
  async getChatById(
    @CurrentUser('uid') userId: string,
    @Param('chatId') chatId: string,
  ): Promise<Chat & { id: string }> {
    return this.chatsService.getChatById(chatId, userId);
  }

  @Delete(':chatId')
  @ApiOperation({
    summary: 'Delete a chat',
    description: 'Delete a chat and all its messages (only for chat members)',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 400, description: 'Not a member of this chat' })
  async deleteChat(
    @CurrentUser('uid') userId: string,
    @Param('chatId') chatId: string,
  ): Promise<{ success: boolean }> {
    await this.chatsService.deleteChat(chatId, userId);
    return { success: true };
  }

  // ==================== MESSAGES ====================

  @Post(':chatId/messages')
  @ApiOperation({
    summary: 'Send a message',
    description: 'Send a new message in a chat. The sender will be the authenticated user.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 400, description: 'Not a member of this chat' })
  async sendMessage(
    @CurrentUser('uid') userId: string,
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<Message & { id: string }> {
    return this.chatsService.sendMessage(chatId, userId, sendMessageDto);
  }

  @Get(':chatId/messages')
  @ApiOperation({
    summary: 'Get chat messages',
    description:
      'Get all messages from a chat with sender information. Messages are ordered by newest first.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of messages to return (default: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: [MessageWithSenderResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 400, description: 'Not a member of this chat' })
  async getChatMessages(
    @CurrentUser('uid') userId: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
  ): Promise<(MessageWithSender & { id: string })[]> {
    return this.chatsService.getChatMessages(chatId, userId, limit ? parseInt(limit) : undefined);
  }

  @Delete(':chatId/messages/:messageId')
  @ApiOperation({
    summary: 'Delete a message',
    description: 'Delete a message (only the sender can delete their own messages)',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 400, description: 'Can only delete your own messages' })
  async deleteMessage(
    @CurrentUser('uid') userId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ): Promise<{ success: boolean }> {
    await this.chatsService.deleteMessage(chatId, messageId, userId);
    return { success: true };
  }

  @Post(':chatId/messages/:messageId/reactions')
  @ApiOperation({
    summary: 'Add reaction to message',
    description: 'Add or update emoji reaction to a message',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: AddReactionDto })
  @ApiResponse({
    status: 200,
    description: 'Reaction added successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 400, description: 'Not a member of this chat' })
  async addReaction(
    @CurrentUser('uid') userId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Body() body: AddReactionDto,
  ): Promise<{ success: boolean }> {
    await this.chatsService.addReactionToMessage(chatId, messageId, userId, body.emoji);
    return { success: true };
  }

  @Delete(':chatId/messages/:messageId/reactions')
  @ApiOperation({
    summary: 'Remove reaction from message',
    description: 'Remove current user reaction from a message',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Reaction removed successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 400, description: 'Not a member of this chat' })
  async removeReaction(
    @CurrentUser('uid') userId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ): Promise<{ success: boolean }> {
    await this.chatsService.removeReactionFromMessage(chatId, messageId, userId);
    return { success: true };
  }
}
