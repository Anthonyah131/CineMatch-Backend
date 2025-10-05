import { Timestamp } from 'firebase-admin/firestore';

/**
 * User statistics document interface
 * Document ID should match the user's UID
 */
export interface UserStats {
  trophies: number;
  leagueId: string;
  rankPoints: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  correct: number;
  wrong: number;
  accuracyRate: number; // Calculated as correct/(correct+wrong) * 100
  bestStreak: number;
  updatedAt: Timestamp;
}

/**
 * DTO for creating initial user stats
 */
export interface CreateUserStatsDto {
  leagueId?: string;
}

/**
 * DTO for updating user stats after a match
 */
export interface UpdateUserStatsDto {
  trophies?: number;
  leagueId?: string;
  rankPoints?: number;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  correct?: number;
  wrong?: number;
  bestStreak?: number;
}

/**
 * Match result for updating user stats
 */
export interface MatchResult {
  won: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  streak: number;
  pointsEarned: number;
}

/**
 * User ranking information
 */
export interface UserRanking {
  uid: string;
  displayName: string;
  photoURL: string;
  rankPoints: number;
  leagueId: string;
  position: number;
}
