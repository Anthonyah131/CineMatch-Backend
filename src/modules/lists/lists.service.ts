import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { List } from './list.model';
import { CreateListDto } from './dto/create-list.dto';

@Injectable()
export class ListsService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  async createList(userId: string, listData: CreateListDto): Promise<List> {
    const listRef = this.firestore.collection('lists').doc();
    const newList: List = {
      ownerId: userId,
      title: listData.name,
      description: listData.description || '',
      isPublic: listData.isPublic ?? true,
      cover: {
        tmdbId: 0,
        mediaType: 'movie',
        title: '',
        posterPath: '',
      },
      itemsCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await listRef.set(newList);
    return newList;
  }

  async getUserLists(userId: string): Promise<List[]> {
    const snapshot = await this.firestore
      .collection('lists')
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as List);
  }

  async getListById(listId: string): Promise<List> {
    const doc = await this.firestore.collection('lists').doc(listId).get();

    if (!doc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    return doc.data() as List;
  }

  async updateList(listId: string, updateData: Partial<List>): Promise<List> {
    const listRef = this.firestore.collection('lists').doc(listId);
    const doc = await listRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    await listRef.update(updatedData);

    const updatedDoc = await listRef.get();
    return updatedDoc.data() as List;
  }
  async deleteList(listId: string): Promise<void> {
    const listRef = this.firestore.collection('lists').doc(listId);
    const doc = await listRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    await listRef.delete();
  }
}
