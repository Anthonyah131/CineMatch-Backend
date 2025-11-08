import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating a media log
 * Solo permite actualizar campos editables (rating, review, reviewLang, notes)
 *
 * @example
 * Ejemplo de request body para actualizar un log:
 * {
 *   "rating": 5.0,
 *   "review": "Después de verla de nuevo, definitivamente es una obra maestra!",
 *   "notes": "Re-watch en casa, noté muchos más detalles"
 * }
 */
export class UpdateMediaLogDto {
  @ApiPropertyOptional({
    description: 'Calificación actualizada de 0 a 5 estrellas (puede tener decimales)',
    example: 5.0,
    minimum: 0,
    maximum: 5,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rating debe ser un número' })
  @Min(0, { message: 'Rating mínimo es 0' })
  @Max(5, { message: 'Rating máximo es 5' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Reseña actualizada sobre el contenido',
    example: 'Después de verla de nuevo, definitivamente es una obra maestra absoluta!',
  })
  @IsOptional()
  @IsString({ message: 'Review debe ser texto' })
  review?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que se vio el contenido',
    example: {
      seconds: 1625257200,
      nanoseconds: 0,
    },
  })
  @IsOptional()
  watchedAt?: {
    seconds: number;
    nanoseconds: number;
  };

  @ApiPropertyOptional({
    description: 'Código de idioma de la reseña actualizada (ISO 639-1)',
    example: 'es',
    examples: ['es', 'en', 'fr', 'pt'],
  })
  @IsOptional()
  @IsString({ message: 'Idioma debe ser texto' })
  reviewLang?: string;

  @ApiPropertyOptional({
    description: 'Notas personales actualizadas sobre la visualización',
    example: 'Re-watch en casa, noté muchos más detalles de la trama',
  })
  @IsOptional()
  @IsString({ message: 'Notes debe ser texto' })
  notes?: string;
}
