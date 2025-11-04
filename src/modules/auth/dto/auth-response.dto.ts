import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User data included in authentication responses
 */
export class AuthUserDto {
  @ApiProperty({
    description: "User's unique Firebase identifier (UID). Used for all user-related operations.",
    example: 'M1CVo2OdFGXA9nyLCvRnGF5rBg13',
    type: String,
  })
  uid: string;

  @ApiProperty({
    description: "User's email address from Firebase authentication provider.",
    example: 'john.doe@example.com',
    type: String,
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description:
      "User's display name. Typically comes from the authentication provider (Google, Facebook, etc.) " +
      'or can be set manually during registration.',
    example: 'John Doe',
    type: String,
  })
  displayName: string;

  @ApiPropertyOptional({
    description:
      "URL to the user's profile photo. Usually provided by the authentication provider (Google, Facebook, etc.). " +
      'May be null if no photo is available.',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
    type: String,
    required: false,
  })
  photoURL?: string;
}

/**
 * Authentication response containing JWT token and user data
 *
 * @description
 * This response is returned after successful login or registration.
 * The token should be included in the Authorization header for all protected endpoints.
 *
 * @example
 * ```typescript
 * // Using the token in subsequent requests:
 * headers: {
 *   'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * }
 * ```
 */
export class AuthResponseDto {
  @ApiProperty({
    description:
      'JWT (JSON Web Token) for authenticating subsequent API requests. ' +
      'Include this token in the Authorization header as "Bearer <token>". ' +
      'Token expires after 7 days by default.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJNMUNWbzJPZEZHWEE5bnlMQ3ZSbkdGNXJCZzEzIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImRpc3BsYXlOYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE2OTg3ODk2MDAsImV4cCI6MTY5OTM5NDQwMH0.abc123...',
    type: String,
  })
  token: string;

  @ApiProperty({
    description: 'Basic information about the authenticated user.',
    type: AuthUserDto,
  })
  user: AuthUserDto;
}
