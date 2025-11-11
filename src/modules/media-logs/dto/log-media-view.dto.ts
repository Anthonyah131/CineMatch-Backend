import { IsInt, Min, IsIn, IsBoolean, IsNumber, IsOptional, IsString, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for logging a media viewing event
 *
 * @example
 * Ejemplo de request body para registrar una película:
 * {
 *   "tmdbId": 550,
 *   "mediaType": "movie",
 *   "hadSeenBefore": false,
 *   "rating": 4.5,
 *   "review": "Increíble película con giros inesperados!",
 *   "reviewLang": "es",
 *   "notes": "Vi esta película en el cine con amigos"
 * }
 */
export class LogMediaViewDto {
  @ApiProperty({
    description: 'ID de TMDb de la película/serie (automáticamente se busca/cachea desde TMDb)',
    example: 550,
    type: Number,
  })
  @IsInt({ message: 'TMDb ID debe ser un número entero' })
  @Min(1, { message: 'TMDb ID debe ser mayor a 0' })
  tmdbId: number;

  @ApiProperty({
    description: 'Tipo de contenido',
    enum: ['movie', 'tv'],
    example: 'movie',
  })
  @IsIn(['movie', 'tv'], { message: 'Tipo de media debe ser movie o tv' })
  mediaType: 'movie' | 'tv';

  @ApiProperty({
    description: 'Fecha y hora en que se vio el contenido',
    example: {
      _seconds: 1625257200,
      _nanoseconds: 0,
    },
    required: false,
  })
  @IsOptional()
  watchedAt?: {
    _seconds: number;
    _nanoseconds: number;
  };

  @ApiProperty({
    description: 'Si el usuario ya había visto este contenido antes',
    example: false,
  })
  @IsBoolean({ message: 'hadSeenBefore debe ser booleano' })
  hadSeenBefore: boolean;

  @ApiPropertyOptional({
    description: 'Calificación de 0 a 5 estrellas (puede tener decimales como 4.5)',
    example: 4.5,
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
    description: 'Reseña escrita por el usuario sobre el contenido',
    example: 'Increíble película con giros inesperados y actuaciones espectaculares!',
  })
  @IsOptional()
  @IsString({ message: 'Review debe ser texto' })
  review?: string;

  @ApiPropertyOptional({
    description: 'Código de idioma de la reseña (ISO 639-1)',
    example: 'es',
    examples: ['es', 'en', 'fr', 'pt'],
  })
  @IsOptional()
  @IsString({ message: 'Idioma debe ser texto' })
  reviewLang?: string;

  @ApiPropertyOptional({
    description: 'Notas personales sobre la visualización (contexto, compañía, lugar, etc.)',
    example: 'Vi esta película en el cine con amigos, fue una experiencia increíble',
  })
  @IsOptional()
  @IsString({ message: 'Notes debe ser texto' })
  notes?: string;
}
