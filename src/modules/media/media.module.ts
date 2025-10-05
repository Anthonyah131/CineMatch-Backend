import { Module } from '@nestjs/common';
import { MediaCacheService } from './media.service';
import { FirebaseModule } from '../../config/firebase.module';
import { MediaController } from './media.controller';
import { TmdbModule } from '../tmdb/tmdb.module';

@Module({
  imports: [FirebaseModule, TmdbModule],
  controllers: [MediaController],
  providers: [MediaCacheService],
  exports: [MediaCacheService],
})
export class MediaModule {}
