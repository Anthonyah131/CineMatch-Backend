import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateForumDto {
  @ApiProperty({
    description: 'Título del foro',
    example: 'Discusión sobre películas de ciencia ficción',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descripción del foro',
    example: 'Un espacio para hablar sobre películas de ciencia ficción clásicas y modernas',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
