import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Nuevo contenido del post',
    example: '¿Qué opinan de la película Blade Runner? (Editado)',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
