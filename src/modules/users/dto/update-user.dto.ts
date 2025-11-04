import { IsString, IsOptional, IsArray, IsObject, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { FavoriteItem } from '../user.model';
import type { UserSettings } from '../../../models/base.model';

/**
 * DTO for updating user profile information
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Profile photo URL',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
  })
  @IsOptional()
  @IsString()
  photoURL?: string;

  @ApiPropertyOptional({
    description: 'User biography (max 500 characters recommended)',
    example: 'Movie enthusiast 🍿 | Sci-Fi & Horror fan',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Birthdate in ISO 8601 format (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({
    description: 'Favorites list (not recommended to update directly, use favorites endpoints)',
  })
  @IsOptional()
  @IsArray()
  favorites?: FavoriteItem[];

  @ApiPropertyOptional({
    description: 'User settings (language, region, privacy)',
  })
  @IsOptional()
  @IsObject()
  settings?: UserSettings;
}
