import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Contenido del comentario',
    example: 'Me encantó esa película, una obra maestra del cine',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
