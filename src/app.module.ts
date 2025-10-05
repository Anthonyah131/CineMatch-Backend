import { Module } from '@nestjs/common';
import { HelloController } from './controllers/hello.controller';
import { FirebaseModule } from './config/firebase.module';
import { UsersModule } from './modules/users/users.module';
import { ListsModule } from './modules/lists/lists.module';
import { MediaModule } from './modules/media/media.module';
import { AuthModule } from './modules/auth/auth.module';
import { MatchesModule } from './modules/matches/matches.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';

@Module({
  imports: [
    FirebaseModule,
    UsersModule,
    ListsModule,
    MediaModule,
    AuthModule,
    MatchesModule,
    TmdbModule,
  ],
  controllers: [HelloController],
  providers: [],
})
export class AppModule {}
