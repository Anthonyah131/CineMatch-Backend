import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { FirebaseModule } from '../../config/firebase.module';

/**
 * Lists Module
 *
 * Manages user-created lists and their media items.
 * Provides functionality for creating, managing, and organizing collections of movies/TV shows.
 *
 * Features:
 * - Create, update, delete lists
 * - Add, update, remove items from lists
 * - Public/private list visibility
 * - Owner-only modifications
 * - List item counting
 *
 * @module ListsModule
 */
@Module({
  imports: [FirebaseModule],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService],
})
export class ListsModule {}
