import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsEmail,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FavoriteItem } from '../user.model';
import type { UserSettings } from '../../../models/base.model';

/**
 * DTO for creating a new user (typically used by auth service)
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Firebase UID - unique identifier from Firebase Authentication',
    example: 'M1CVo2OdFGXA9nyLCvRnGF5rBg13',
  })
  @IsString()
  @IsNotEmpty()
  uid: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Profile photo URL',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
  })
  @IsOptional()
  @IsString()
  photoURL?: string;

  @ApiPropertyOptional({
    description: 'User biography',
    example: 'Movie enthusiast 🍿',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Birthdate in ISO 8601 format',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsString()
  birthdate?: string;

  @ApiPropertyOptional({
    description: 'Initial favorites list (usually empty)',
  })
  @IsOptional()
  @IsArray()
  favorites?: FavoriteItem[];

  @ApiPropertyOptional({
    description: 'User settings',
  })
  @IsOptional()
  @IsObject()
  settings?: UserSettings;

  @ApiPropertyOptional({
    description: 'Authentication provider information',
  })
  @IsOptional()
  @IsObject()
  authProvider?: {
    provider: 'google' | 'facebook' | 'apple' | 'email';
    providerId: string;
  };

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
