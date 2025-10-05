import { IsString, IsOptional, IsArray, IsObject, IsEmail } from 'class-validator';
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
}
