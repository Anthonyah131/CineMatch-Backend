import { Timestamp } from 'firebase-admin/firestore';
import { MatchStatus } from '../../models/base.model';

/**
 * Match round information
 */
export interface MatchRound {
  quoteId: string;
  answer: number; // The correct TMDB ID
  winner?: string; // UID of the round winner
  timeMs: number; // Time taken to answer in milliseconds
}

/**
 * Match scoreboard (uid -> points)
 */
export interface Scoreboard {
  [uid: string]: number;
}

/**
 * Main Match document interface
 */
export interface Match {
  players: string[]; // Array of player UIDs
  leagueId: string;
  status: MatchStatus;
  scoreboard: Scoreboard;
  rounds: MatchRound[];
  startedAt: Timestamp;
  endedAt?: Timestamp;
}

/**
 * League document interface
 */
export interface League {
  name: string;
  minRP: number; // Minimum rank points to enter
  maxRP: number; // Maximum rank points (for league cap)
  emoji: string;
}

/**
 * DTO for creating a new match
 */
export interface CreateMatchDto {
  players: string[];
  leagueId: string;
}

/**
 * DTO for updating match status
 */
export interface UpdateMatchDto {
  status?: MatchStatus;
  scoreboard?: Scoreboard;
  endedAt?: Timestamp;
}

/**
 * DTO for adding a round to a match
 */
export interface AddRoundDto {
  quoteId: string;
  answer: number;
  winner?: string;
  timeMs: number;
}

/**
 * Match summary for leaderboards
 */
export interface MatchSummary {
  matchId: string;
  players: string[];
  winner: string;
  leagueId: string;
  endedAt: Timestamp;
  rounds: number;
}
