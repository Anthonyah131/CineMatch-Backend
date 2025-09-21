import { Module } from '@nestjs/common';
import { HelloController } from './controllers/hello.controller';

@Module({
  imports: [],
  controllers: [HelloController],
  providers: [],
})
export class AppModule {}
