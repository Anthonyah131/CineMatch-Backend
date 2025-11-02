import { IsString, IsOptional, IsArray, IsObject, IsEmail, IsBoolean } from 'class-validator';
import type { FavoriteItem } from '../user.model';
import type { UserSettings } from '../../../models/base.model';

export class CreateUserDto {
  @IsString()
  uid: string;

  @IsString()
  displayName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  photoURL?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  birthdate?: string;

  @IsOptional()
  @IsArray()
  favorites?: FavoriteItem[];

  @IsOptional()
  @IsObject()
  settings?: UserSettings;

  @IsOptional()
  @IsObject()
  authProvider?: {
    provider: 'google' | 'facebook' | 'apple' | 'email';
    providerId: string;
  };

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
