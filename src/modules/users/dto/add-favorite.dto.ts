import { IsInt, IsString, IsNotEmpty, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for adding a movie or TV show to user's favorites
 *
 * @description
 * Validates the data required to add media content to a user's favorite list.
 * Uses TMDB (The Movie Database) identifiers for movies and TV shows.
 *
 * @example
 * ```typescript
 * const favorite = {
 *   tmdbId: 550,
 *   title: "Fight Club",
 *   mediaType: "movie",
 *   posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
 * };
 * ```
 */
export class AddFavoriteDto {
  @ApiProperty({
    description:
      'TMDB (The Movie Database) identifier for the movie or TV show. ' +
      'This is the unique ID from TMDB API.',
    example: 550,
    type: Number,
    minimum: 1,
  })
  @IsInt({ message: 'TMDB ID must be an integer' })
  @Min(1, { message: 'TMDB ID must be greater than 0' })
  @IsNotEmpty({ message: 'TMDB ID is required' })
  tmdbId: number;

  @ApiProperty({
    description: 'Title of the movie or TV show.',
    example: 'Fight Club',
    type: String,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    description: 'Type of media content. Must be either "movie" for movies or "tv" for TV shows.',
    example: 'movie',
    enum: ['movie', 'tv'],
    type: String,
  })
  @IsString({ message: 'Media type must be a string' })
  @IsIn(['movie', 'tv'], { message: 'Media type must be either "movie" or "tv"' })
  @IsNotEmpty({ message: 'Media type is required' })
  mediaType: string;

  @ApiProperty({
    description:
      'Relative path to the poster image on TMDB. ' +
      'This should be the path portion only (e.g., "/abc123.jpg"). ' +
      'Full URL will be: https://image.tmdb.org/t/p/w500{posterPath}',
    example: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    type: String,
  })
  @IsString({ message: 'Poster path must be a string' })
  @IsNotEmpty({ message: 'Poster path is required' })
  posterPath: string;
}
