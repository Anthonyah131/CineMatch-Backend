import { Controller, Get } from '@nestjs/common';

@Controller('hello')
export class HelloController {
  @Get()
  sayHello() {
    return { message: '🎬 Hola Mundo desde CineMatch Backend 🚀' };
  }
}
