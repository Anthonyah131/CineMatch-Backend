import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HelloController } from './controllers/hello.controller';
import { FirebaseModule } from './config/firebase.module';
import { UsersModule } from './modules/users/users.module';
import { ListsModule } from './modules/lists/lists.module';
import { MediaCacheModule } from './modules/media-cache/media-cache.module';
import { MediaLogsModule } from './modules/media-logs/media-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ForumsModule } from './modules/forums/forums.module';
import { ChatsModule } from './modules/chats/chats.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseModule,
    AuthModule,
    UsersModule,
    ListsModule,
    MediaCacheModule,
    MediaLogsModule,
    MatchesModule,
    ForumsModule,
    ChatsModule,
    TmdbModule,
  ],
  controllers: [HelloController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
