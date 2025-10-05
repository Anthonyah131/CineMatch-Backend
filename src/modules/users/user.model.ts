import { BaseDocument, MediaInfo, UserSettings } from '../../models/base.model';

/**
 * User favorite item interface
 */
export interface FavoriteItem extends MediaInfo {
  /** Date when the item was added to favorites */
  addedAt: Date;
}

/**
 * Main User document interface
 */
export interface User extends BaseDocument {
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  birthdate: string; // ISO 8601 date string
  favorites: FavoriteItem[];
  followersCount: number;
  followingCount: number;
  settings: UserSettings;
}

/**
 * User creation interface (without computed fields)
 */
export interface CreateUserDto {
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  birthdate?: string;
  settings?: Partial<UserSettings>;
}

/**
 * User update interface (all fields optional except updatedAt)
 */
export interface UpdateUserDto {
  displayName?: string;
  photoURL?: string;
  bio?: string;
  birthdate?: string;
  settings?: Partial<UserSettings>;
}
