import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Contenido del post',
    example: '¿Qué opinan de la película Blade Runner?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
