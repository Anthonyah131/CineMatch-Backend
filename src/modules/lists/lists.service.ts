import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { List, ListItem } from './list.model';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';

/**
 * Service for managing user lists and list items
 * Handles CRUD operations for lists and their media items
 */
@Injectable()
export class ListsService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  /**
   * Create a new list for a user
   * @param userId - Owner's user ID
   * @param listData - List creation data
   * @returns Created list with ID
   */
  async createList(userId: string, listData: CreateListDto): Promise<List> {
    const listRef = this.firestore.collection('lists').doc();
    const newList: List = {
      ownerId: userId,
      title: listData.title,
      description: listData.description || '',
      isPublic: listData.isPublic ?? true,
      cover: listData.cover || {
        tmdbId: 0,
        mediaType: 'movie' as const,
        title: '',
        posterPath: '',
      },
      itemsCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await listRef.set(newList);
    return { ...newList, id: listRef.id };
  }

  /**
   * Search public lists by title or owner name with pagination
   * Case-insensitive partial match search
   * @param query - Search query for list title or owner name
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Paginated public lists with owner info
   */
  async searchPublicLists(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: (List & { ownerDisplayName: string })[];
    total: number;
    page: number;
    limit: number;
  }> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { items: [], total: 0, page, limit };
    }

    // Fetch all public lists and users to perform in-memory filtering
    // Note: For large datasets, consider using a search service like Algolia
    const [listsSnapshot, usersSnapshot] = await Promise.all([
      this.firestore.collection('lists').where('isPublic', '==', true).get(),
      this.firestore.collection('users').get(),
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

    // Filter lists that match the query in title OR owner displayName
    const matchingDocs = listsSnapshot.docs.filter((doc) => {
      const data = doc.data() as List;
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

    // Enrich with owner display name
    const items = pageDocs.map((doc) => {
      const listData = { id: doc.id, ...doc.data() } as List;
      return {
        ...listData,
        ownerDisplayName: userOriginalNames.get(listData.ownerId) || 'Unknown',
      };
    });

    return { items, total, page, limit };
  }

  /**
   * Get all lists for a specific user
   * @param userId - User ID to get lists for
   * @param currentUserId - Optional current user ID to filter private lists
   * @returns Array of user's lists
   */
  async getUserLists(userId: string, currentUserId?: string): Promise<List[]> {
    const snapshot = await this.firestore.collection('lists').where('ownerId', '==', userId).get();

    let lists = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as List[];

    // If viewing another user's lists, only show public ones
    if (currentUserId !== userId) {
      lists = lists.filter((list) => list.isPublic);
    }

    // Sort by createdAt descending (most recent first)
    lists.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return lists;
  }

  /**
   * Get a specific list by ID
   * @param listId - List ID
   * @param currentUserId - Optional current user ID to check access
   * @returns List data
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if list is private and user is not owner
   */
  async getListById(listId: string, currentUserId?: string): Promise<List> {
    const doc = await this.firestore.collection('lists').doc(listId).get();

    if (!doc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    const list = { id: doc.id, ...doc.data() } as unknown as List;

    // Check if user can access private list
    if (!list.isPublic && list.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this list');
    }

    return list;
  }

  /**
   * Update a list
   * @param listId - List ID to update
   * @param userId - Current user ID
   * @param updateData - Update data
   * @returns Updated list
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user is not the owner
   */
  async updateList(listId: string, userId: string, updateData: UpdateListDto): Promise<List> {
    const listRef = this.firestore.collection('lists').doc(listId);
    const doc = await listRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    const list = doc.data() as List;

    // Only owner can update
    if (list.ownerId !== userId) {
      throw new ForbiddenException('Only the list owner can update it');
    }

    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    await listRef.update(updatedData);

    const updatedDoc = await listRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as unknown as List;
  }

  /**
   * Delete a list and all its items
   * @param listId - List ID to delete
   * @param userId - Current user ID
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user is not the owner
   */
  async deleteList(listId: string, userId: string): Promise<void> {
    const listRef = this.firestore.collection('lists').doc(listId);
    const doc = await listRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    const list = doc.data() as List;

    // Only owner can delete
    if (list.ownerId !== userId) {
      throw new ForbiddenException('Only the list owner can delete it');
    }

    // Delete all items in the list
    const itemsSnapshot = await listRef.collection('items').get();
    const batch = this.firestore.batch();

    itemsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the list itself
    batch.delete(listRef);

    await batch.commit();
  }

  /**
   * Get all items in a list
   * @param listId - List ID
   * @param currentUserId - Optional current user ID to check access
   * @returns Array of list items
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if list is private and user is not owner
   */
  async getListItems(listId: string, currentUserId?: string): Promise<ListItem[]> {
    // First check if list exists and user has access
    await this.getListById(listId, currentUserId);

    const itemsSnapshot = await this.firestore
      .collection('lists')
      .doc(listId)
      .collection('items')
      .orderBy('addedAt', 'desc')
      .get();

    return itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ListItem[];
  }

  /**
   * Add a media item to a list
   * @param listId - List ID
   * @param userId - Current user ID
   * @param itemData - Item data to add
   * @returns Added item
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user is not the owner
   * @throws ConflictException if item already exists in list
   */
  async addListItem(listId: string, userId: string, itemData: AddListItemDto): Promise<ListItem> {
    const listRef = this.firestore.collection('lists').doc(listId);
    const doc = await listRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    const list = doc.data() as List;

    // Only owner can add items
    if (list.ownerId !== userId) {
      throw new ForbiddenException('Only the list owner can add items');
    }

    // Check if item already exists
    const existingItem = await listRef
      .collection('items')
      .where('tmdbId', '==', itemData.tmdbId)
      .where('mediaType', '==', itemData.mediaType)
      .get();

    if (!existingItem.empty) {
      throw new ConflictException('This item already exists in the list');
    }

    // Add the item
    const itemRef = listRef.collection('items').doc();
    const newItem: ListItem = {
      tmdbId: itemData.tmdbId,
      mediaType: itemData.mediaType,
      title: itemData.title,
      posterPath: itemData.posterPath,
      notes: itemData.notes || '',
      addedAt: Timestamp.now(),
    };

    await itemRef.set(newItem);

    // Update list itemsCount and cover if it's empty
    const updateData: Record<string, any> = {
      itemsCount: list.itemsCount + 1,
      updatedAt: Timestamp.now(),
    };

    // If list has no cover set (empty cover), use the first item as cover
    if (list.itemsCount === 0 && list.cover.tmdbId === 0) {
      updateData['cover'] = {
        tmdbId: itemData.tmdbId,
        mediaType: itemData.mediaType,
        title: itemData.title,
        posterPath: itemData.posterPath,
      };
    }

    await listRef.update(updateData);

    return { id: itemRef.id, ...newItem };
  }

  /**
   * Update a list item
   * @param listId - List ID
   * @param itemId - Item ID to update
   * @param userId - Current user ID
   * @param updateData - Update data
   * @returns Updated item
   * @throws NotFoundException if list or item doesn't exist
   * @throws ForbiddenException if user is not the owner
   */
  async updateListItem(
    listId: string,
    itemId: string,
    userId: string,
    updateData: UpdateListItemDto,
  ): Promise<ListItem> {
    const listRef = this.firestore.collection('lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    const list = listDoc.data() as List;

    // Only owner can update items
    if (list.ownerId !== userId) {
      throw new ForbiddenException('Only the list owner can update items');
    }

    const itemRef = listRef.collection('items').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    await itemRef.update({ ...updateData });

    const updatedDoc = await itemRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as unknown as ListItem;
  }

  /**
   * Remove a media item from a list
   * @param listId - List ID
   * @param itemId - Item ID to remove
   * @param userId - Current user ID
   * @throws NotFoundException if list or item doesn't exist
   * @throws ForbiddenException if user is not the owner
   */
  async removeListItem(listId: string, itemId: string, userId: string): Promise<void> {
    const listRef = this.firestore.collection('lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    const list = listDoc.data() as List;

    // Only owner can remove items
    if (list.ownerId !== userId) {
      throw new ForbiddenException('Only the list owner can remove items');
    }

    const itemRef = listRef.collection('items').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    const itemToRemove = itemDoc.data() as ListItem;
    await itemRef.delete();

    // Prepare update data
    const updateData: Record<string, any> = {
      itemsCount: list.itemsCount - 1,
      updatedAt: Timestamp.now(),
    };

    // Check if the removed item was the list cover
    const removedItemWasCover = list.cover.tmdbId === itemToRemove.tmdbId;

    if (removedItemWasCover) {
      // If this was the last item, reset cover to empty
      if (list.itemsCount === 1) {
        updateData['cover'] = {
          tmdbId: 0,
          mediaType: 'movie' as const,
          title: '',
          posterPath: '',
        };
      } else {
        // Find the next available item to use as cover
        const remainingItemsSnapshot = await listRef.collection('items')
          .where('tmdbId', '!=', itemToRemove.tmdbId)
          .limit(1)
          .get();

        if (!remainingItemsSnapshot.empty) {
          const nextItem = remainingItemsSnapshot.docs[0].data() as ListItem;
          updateData['cover'] = {
            tmdbId: nextItem.tmdbId,
            mediaType: nextItem.mediaType,
            title: nextItem.title,
            posterPath: nextItem.posterPath,
          };
        } else {
          // Fallback: reset to empty cover
          updateData['cover'] = {
            tmdbId: 0,
            mediaType: 'movie' as const,
            title: '',
            posterPath: '',
          };
        }
      }
    }

    await listRef.update(updateData);
  }
}
