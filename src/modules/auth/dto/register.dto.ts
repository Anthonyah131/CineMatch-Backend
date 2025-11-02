import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Firebase ID token from Google authentication',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlM...',
  })
  @IsString()
  @IsNotEmpty()
  firebaseToken: string;

  @ApiPropertyOptional({
    description: 'User display name (optional, will use Google name if not provided)',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Movie enthusiast and popcorn lover',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description: 'User birthdate in ISO format',
    example: '1990-01-01',
  })
  @IsString()
  @IsOptional()
  birthdate?: string;
}
