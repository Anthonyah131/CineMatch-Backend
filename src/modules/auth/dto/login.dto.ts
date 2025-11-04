import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user login with Firebase authentication
 *
 * @description
 * This endpoint validates the Firebase ID token and returns a JWT token for authenticated requests.
 * If the user doesn't exist in the database, it will be created automatically with the Firebase user data.
 *
 * @example
 * ```typescript
 * const loginData = {
 *   firebaseToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlM..."
 * };
 * ```
 */
export class LoginDto {
  @ApiProperty({
    description:
      'Firebase ID token obtained from Firebase Authentication (Google, Facebook, etc.). ' +
      'This token is validated on the backend to verify user identity. ' +
      'The token is obtained from the Firebase client SDK after successful authentication.',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlMzU4ZDJjODU...',
    required: true,
    type: String,
  })
  @IsString({ message: 'Firebase token must be a string' })
  @IsNotEmpty({ message: 'Firebase token is required' })
  firebaseToken: string;
}
