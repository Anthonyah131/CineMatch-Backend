import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for user registration with Firebase authentication
 *
 * @description
 * Registers a new user in the database after validating their Firebase ID token.
 * All fields except firebaseToken are optional and will use Firebase profile data as defaults.
 * If a user already exists, returns a 409 Conflict error.
 *
 * @note
 * For automatic user creation on login (without explicit registration), use the /auth/login endpoint instead.
 *
 * @example
 * ```typescript
 * const registerData = {
 *   firebaseToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlM...",
 *   displayName: "John Doe",
 *   bio: "Movie enthusiast and popcorn lover",
 *   birthdate: "1990-01-01"
 * };
 * ```
 */
export class RegisterDto {
  @ApiProperty({
    description:
      'Firebase ID token obtained from Firebase Authentication (Google, Facebook, Apple, etc.). ' +
      'Required for all registration requests. This token is validated to verify user identity and extract profile information.',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlMzU4ZDJjODU...',
    required: true,
    type: String,
  })
  @IsString({ message: 'Firebase token must be a string' })
  @IsNotEmpty({ message: 'Firebase token is required' })
  firebaseToken: string;

  @ApiPropertyOptional({
    description:
      "User's display name. If not provided, will use the name from the Firebase authentication provider " +
      '(e.g., Google profile name). Can be changed later through the user update endpoint.',
    example: 'John Doe',
    required: false,
    type: String,
  })
  @IsString({ message: 'Display name must be a string' })
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({
    description:
      "User's biography or description. Optional field that can be used to share interests, favorite genres, etc. " +
      'Maximum recommended length: 500 characters.',
    example: 'Movie enthusiast and popcorn lover 🍿 | Sci-Fi & Horror fan',
    required: false,
    type: String,
  })
  @IsString({ message: 'Bio must be a string' })
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description:
      "User's date of birth in ISO 8601 format (YYYY-MM-DD). " +
      'Used for age verification and personalized content recommendations. ' +
      'Must be a valid date in the past.',
    example: '1990-01-15',
    required: false,
    type: String,
    format: 'date',
  })
  @IsDateString({}, { message: 'Birthdate must be a valid ISO 8601 date string (YYYY-MM-DD)' })
  @IsOptional()
  birthdate?: string;
}
