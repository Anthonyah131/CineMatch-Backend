import { IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListCoverDto } from './list-cover.dto';

/**
 * DTO for updating a list
 * All fields are optional as this is a partial update
 */
export class UpdateListDto {
  @ApiPropertyOptional({
    description: 'List title',
    example: 'My Favorite Sci-Fi Movies',
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @ApiPropertyOptional({
    description: 'List description',
    example: 'A collection of my all-time favorite science fiction films',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the list is public',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPublic must be a boolean' })
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Cover media for the list',
    type: ListCoverDto,
    example: {
      tmdbId: 603,
      mediaType: 'movie',
      title: 'The Matrix',
      posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      customTitle: 'Best Sci-Fi Ever',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ListCoverDto)
  cover?: ListCoverDto;
}
