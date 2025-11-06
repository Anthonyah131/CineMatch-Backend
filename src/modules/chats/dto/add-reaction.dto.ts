import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReactionDto {
  @ApiProperty({
    description: 'Emoji de reacción',
    example: '👍',
  })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
