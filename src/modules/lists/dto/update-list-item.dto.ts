import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating a list item
 * Currently only notes can be updated
 */
export class UpdateListItemDto {
  @ApiPropertyOptional({
    description: 'Personal notes about this media',
    example: 'Updated my thoughts - this is a masterpiece',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
