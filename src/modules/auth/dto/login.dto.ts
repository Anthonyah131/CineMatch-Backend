import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Firebase ID token from Google authentication',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlM...',
  })
  @IsString()
  @IsNotEmpty()
  firebaseToken: string;
}
