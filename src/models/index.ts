// Base types and interfaces
export * from './base.model';

// User related models
export * from '../modules/users/user.model';
export * from '../modules/users/user-relations.model';
export * from '../modules/users/user-stats.model';

// Content models
export * from '../modules/lists/list.model';
export * from '../modules/media/user-media.model';
export * from '../modules/media/media-cache.model';

// Game models
export * from '../modules/matches/match.model';
export * from '../modules/matches/movie-quote.model';

// Social models
export * from '../modules/chats/chat.model';
export * from '../modules/forums/forum.model';

// Re-export Firebase types for convenience
export { Timestamp, FieldValue } from 'firebase-admin/firestore';
