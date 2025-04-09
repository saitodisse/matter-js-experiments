/**
 * types.ts
 *
 * Defines shared types and interfaces for the game manager modules.
 */

// Define game modes
export enum GameMode {
    Single = "single",
    Two = "two",
    None = "none",
}

// Define match length modes
export enum MatchLengthMode {
    BestOf3 = "bestOf3",
    BestOf5 = "bestOf5",
    BestOf7 = "bestOf7",
}

// Define structure for round history
export interface RoundResult {
    round: number;
    scoreP1: number; // Shapes pocketed in round
    attemptsP1: number;
    roundScore1P?: number; // Calculated score for 1P ranking (0-100)
    scoreP2?: number; // Optional for 2P mode
    attemptsP2?: number; // Optional for 2P mode
    roundScoreP1_2P?: number; // Calculated score for P1 in 2P round (0-100)
    roundScoreP2_2P?: number; // Calculated score for P2 in 2P round (0-100)
}

// Define structure for ranking entries
export interface RankingEntry1P {
    name: string;
    score: number; // Total match score (sum of round accuracy scores, max 400)
    matchMode: MatchLengthMode; // The match length mode used
}
// New interface for 2P individual ranking
export interface RankingEntry2PIndividual {
    name: string;
    score: number; // Total match score (sum of round accuracy scores)
    matchMode: MatchLengthMode; // The match length mode used
}

// Type for game reset scenarios
export type GameResetType =
    | "fullMatchRestart"
    | "nextRoundSetup"
    | "currentRoundRestart";
