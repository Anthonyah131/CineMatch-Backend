import { BaseDocument, MediaInfo, UserSettings } from '../../models/base.model';

/**
 * User favorite item interface
 */
export interface FavoriteItem extends MediaInfo {
  /** Date when the item was added to favorites */
  addedAt: Date;
}

/**
 * Authentication provider information
 */
export interface AuthProvider {
  /** Provider type (google, facebook, apple, etc.) */
  provider: 'google' | 'facebook' | 'apple' | 'email';
  /** Provider user ID */
  providerId: string;
  /** Date when the account was linked */
  linkedAt: Date;
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
  /** Authentication providers linked to this account */
  authProviders: AuthProvider[];
  /** Email verification status */
  emailVerified: boolean;
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
  authProvider?: {
    provider: 'google' | 'facebook' | 'apple' | 'email';
    providerId: string;
  };
  emailVerified?: boolean;
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
