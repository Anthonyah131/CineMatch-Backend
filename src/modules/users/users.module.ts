import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FirebaseModule } from '../../config/firebase.module';
import { MediaLogsModule } from '../media-logs/media-logs.module';

@Module({
  imports: [FirebaseModule, MediaLogsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
