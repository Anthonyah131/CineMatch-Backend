import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({
    description: 'ID del usuario destinatario del chat',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiPropertyOptional({
    description: 'Mensaje inicial opcional',
    example: 'Hola! Vi que también te gustó Inception',
  })
  @IsString()
  @IsOptional()
  initialMessage?: string;
}
