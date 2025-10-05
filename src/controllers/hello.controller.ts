import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('hello')
@Controller('hello')
export class HelloController {
  @Get()
  @ApiOperation({ summary: 'Hello World endpoint' })
  @ApiResponse({ status: 200, description: 'Returns a welcome message' })
  sayHello() {
    return { message: 'Ã°Å¸Å½Â¬ Hola Mundo desde CineMatch Backend Ã°Å¸Å¡â‚¬' };
  }
}
