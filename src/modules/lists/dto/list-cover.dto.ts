import { IsInt, IsString, IsIn, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for list cover (featured media)
 */
export class ListCoverDto {
  @ApiProperty({
    description: 'TMDB ID of the media',
    example: 550,
    minimum: 1,
  })
  @IsInt({ message: 'tmdbId must be an integer' })
  @Min(1, { message: 'tmdbId must be at least 1' })
  tmdbId: number;

  @ApiProperty({
    description: 'Media type',
    enum: ['movie', 'tv'],
    example: 'movie',
  })
  @IsIn(['movie', 'tv'], { message: 'mediaType must be either movie or tv' })
  mediaType: 'movie' | 'tv';

  @ApiProperty({
    description: 'Title of the media',
    example: 'Fight Club',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title: string;

  @ApiProperty({
    description: 'Poster path from TMDB',
    example: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  })
  @IsString({ message: 'posterPath must be a string' })
  @IsNotEmpty({ message: 'posterPath cannot be empty' })
  posterPath: string;

  @ApiPropertyOptional({
    description: 'Custom title for the cover (overrides media title)',
    example: 'My Favorite Collection',
  })
  @IsOptional()
  @IsString({ message: 'customTitle must be a string' })
  customTitle?: string;
}
