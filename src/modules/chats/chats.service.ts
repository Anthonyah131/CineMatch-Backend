import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { CreateChatDto, SendMessageDto } from './dto';
import type { Chat, Message, ChatSummary, MessageWithSender } from './chat.model';
import { MessageType } from '../../models/base.model';

@Injectable()
export class ChatsService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  private get chatsCollection() {
    return this.firestore.collection('chats');
  }

  private get usersCollection() {
    return this.firestore.collection('users');
  }

  // ==================== CHATS ====================

  /**
   * Create a new chat between two users or get existing chat
   */
  async createOrGetChat(
    currentUserId: string,
    createChatDto: CreateChatDto,
  ): Promise<Chat & { id: string }> {
    const { recipientId, initialMessage } = createChatDto;

    // Validar que no intente crear un chat consigo mismo
    if (currentUserId === recipientId) {
      throw new BadRequestException('Cannot create a chat with yourself');
    }

    // Verificar que el destinatario existe
    const recipientDoc = await this.usersCollection.doc(recipientId).get();
    if (!recipientDoc.exists) {
      throw new NotFoundException(`User with ID ${recipientId} not found`);
    }

    // Buscar si ya existe un chat entre estos dos usuarios
    const members = [currentUserId, recipientId].sort(); // Ordenamos para búsqueda consistente

    const existingChats = await this.chatsCollection.where('members', '==', members).limit(1).get();

    let chatId: string;
    let chatData: Chat;

    if (!existingChats.empty) {
      // Chat ya existe
      const existingChat = existingChats.docs[0];
      chatId = existingChat.id;
      chatData = existingChat.data() as Chat;
    } else {
      // Crear nuevo chat
      chatData = {
        members,
        lastMessage: initialMessage || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await this.chatsCollection.add(chatData);
      chatId = docRef.id;

      // Si hay mensaje inicial, enviarlo
      if (initialMessage) {
        await this.sendMessage(chatId, currentUserId, {
          text: initialMessage,
          type: MessageType.TEXT,
        });
      }
    }

    return {
      id: chatId,
      ...chatData,
    } as Chat & { id: string };
  }

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string, limit = 50): Promise<ChatSummary[]> {
    const snapshot = await this.chatsCollection
      .where('members', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    const chats: ChatSummary[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Chat;

      // TODO: Implementar contador de mensajes no leídos
      // Necesitarías agregar un campo 'readBy' array en cada mensaje
      // o un campo 'lastReadAt' en el documento del chat por usuario

      chats.push({
        chatId: doc.id,
        members: data.members,
        lastMessage: data.lastMessage,
        lastMessageAt: data.updatedAt,
        unreadCount: 0, // Por ahora en 0, implementar lógica de "leído" después
      });
    }

    return chats;
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string): Promise<Chat & { id: string }> {
    const doc = await this.chatsCollection.doc(chatId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const chatData = doc.data() as Chat;

    // Verificar que el usuario es miembro del chat
    if (!chatData.members.includes(userId)) {
      throw new BadRequestException('You are not a member of this chat');
    }

    return {
      id: doc.id,
      ...chatData,
    } as Chat & { id: string };
  }

  /**
   * Delete a chat (solo si eres miembro)
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    const docRef = this.chatsCollection.doc(chatId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const chatData = doc.data() as Chat;

    // Verificar que el usuario es miembro del chat
    if (!chatData.members.includes(userId)) {
      throw new BadRequestException('You are not a member of this chat');
    }

    // Eliminar todos los mensajes
    const messagesSnapshot = await docRef.collection('messages').get();
    const batch = this.firestore.batch();

    messagesSnapshot.docs.forEach((messageDoc) => {
      batch.delete(messageDoc.ref);
    });

    await batch.commit();

    // Eliminar el chat
    await docRef.delete();
  }

  // ==================== MESSAGES ====================

  /**
   * Send a message in a chat
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<Message & { id: string }> {
    const chatDoc = await this.chatsCollection.doc(chatId).get();

    if (!chatDoc.exists) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const chatData = chatDoc.data() as Chat;

    // Verificar que el usuario es miembro del chat
    if (!chatData.members.includes(senderId)) {
      throw new BadRequestException('You are not a member of this chat');
    }

    const messageData: Message = {
      senderId,
      text: sendMessageDto.text,
      type: sendMessageDto.type || MessageType.TEXT,
      reactions: {},
      createdAt: Timestamp.now(),
    };

    // Guardar mensaje
    const docRef = await this.chatsCollection.doc(chatId).collection('messages').add(messageData);

    // Actualizar lastMessage del chat
    await this.chatsCollection.doc(chatId).update({
      lastMessage: sendMessageDto.text.substring(0, 100), // Primeros 100 caracteres
      updatedAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      ...messageData,
    };
  }

  /**
   * Get messages from a chat with sender information
   */
  async getChatMessages(
    chatId: string,
    userId: string,
    limit = 100,
  ): Promise<(MessageWithSender & { id: string })[]> {
    const chatDoc = await this.chatsCollection.doc(chatId).get();

    if (!chatDoc.exists) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const chatData = chatDoc.data() as Chat;

    // Verificar que el usuario es miembro del chat
    if (!chatData.members.includes(userId)) {
      throw new BadRequestException('You are not a member of this chat');
    }

    const snapshot = await this.chatsCollection
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const messages: (MessageWithSender & { id: string })[] = [];

    for (const doc of snapshot.docs) {
      const messageData = doc.data() as Message;

      // Obtener info del remitente
      const senderDoc = await this.usersCollection.doc(messageData.senderId).get();
      const senderData = senderDoc.data() as
        | { displayName?: string; photoURL?: string }
        | undefined;

      messages.push({
        id: doc.id,
        ...messageData,
        senderDisplayName: senderData?.displayName || 'Unknown',
        senderPhotoURL: senderData?.photoURL || '',
      });
    }

    return messages;
  }

  /**
   * Delete a message (solo el remitente puede borrar)
   */
  async deleteMessage(chatId: string, messageId: string, userId: string): Promise<void> {
    const chatDoc = await this.chatsCollection.doc(chatId).get();

    if (!chatDoc.exists) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const messageDoc = await this.chatsCollection
      .doc(chatId)
      .collection('messages')
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    const messageData = messageDoc.data() as Message;

    // Solo el remitente puede borrar su mensaje
    if (messageData.senderId !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    await messageDoc.ref.delete();
  }

  /**
   * Add reaction to a message
   */
  async addReactionToMessage(
    chatId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    const chatDoc = await this.chatsCollection.doc(chatId).get();

    if (!chatDoc.exists) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const chatData = chatDoc.data() as Chat;

    // Verificar que el usuario es miembro del chat
    if (!chatData.members.includes(userId)) {
      throw new BadRequestException('You are not a member of this chat');
    }

    const messageDoc = await this.chatsCollection
      .doc(chatId)
      .collection('messages')
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await messageDoc.ref.update({
      [`reactions.${userId}`]: emoji,
    });
  }

  /**
   * Remove reaction from a message
   */
  async removeReactionFromMessage(
    chatId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    const chatDoc = await this.chatsCollection.doc(chatId).get();

    if (!chatDoc.exists) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    const chatData = chatDoc.data() as Chat;

    // Verificar que el usuario es miembro del chat
    if (!chatData.members.includes(userId)) {
      throw new BadRequestException('You are not a member of this chat');
    }

    const messageDoc = await this.chatsCollection
      .doc(chatId)
      .collection('messages')
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await messageDoc.ref.update({
      [`reactions.${userId}`]: FieldValue.delete(),
    });
  }
}
