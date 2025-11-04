import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument, MediaInfo } from '../../models/base.model';

/**
 * List cover information (featured media)
 */
export interface ListCover extends MediaInfo {
  /** Optional custom title for the cover */
  customTitle?: string;
}

/**
 * Main List document interface
 */
export interface List extends BaseDocument {
  id?: string;
  ownerId: string;
  title: string;
  description: string;
  isPublic: boolean;
  cover: ListCover;
  itemsCount: number;
}

/**
 * List item document interface (subcollection of lists)
 */
export interface ListItem extends MediaInfo {
  id?: string;
  addedAt: Timestamp;
  notes: string;
  // Inherits tmdbId, mediaType, title, posterPath from MediaInfo
}

/**
 * DTO for creating a new list
 */
export interface CreateListDto {
  ownerId: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  cover?: ListCover;
}

/**
 * DTO for updating a list
 */
export interface UpdateListDto {
  title?: string;
  description?: string;
  isPublic?: boolean;
  cover?: ListCover;
}

/**
 * DTO for adding an item to a list
 */
export interface AddListItemDto extends MediaInfo {
  notes?: string;
}

/**
 * DTO for updating a list item
 */
export interface UpdateListItemDto {
  notes?: string;
}
