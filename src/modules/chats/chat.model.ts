import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument, Reactions, MessageType } from '../../models/base.model';

/**
 * Main Chat document interface
 */
export interface Chat extends BaseDocument {
  members: string[]; // Array of user UIDs
  lastMessage: string;
}

/**
 * Message document interface (subcollection of chats)
 */
export interface Message {
  senderId: string;
  text: string;
  type: MessageType;
  reactions: Reactions; // uid -> emoji
  createdAt: Timestamp;
}

/**
 * Chat summary for chat list
 */
export interface ChatSummary {
  chatId: string;
  members: string[];
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCount: number;
}

/**
 * Message with sender info
 */
export interface MessageWithSender extends Message {
  senderDisplayName: string;
  senderPhotoURL: string;
}
