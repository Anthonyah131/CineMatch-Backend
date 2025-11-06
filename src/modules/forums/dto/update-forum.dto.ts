import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateForumDto {
  @ApiPropertyOptional({
    description: 'Nuevo título del foro',
    example: 'Discusión sobre películas de ciencia ficción',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Nueva descripción del foro',
    example: 'Un espacio para hablar sobre películas de ciencia ficción clásicas y modernas',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
