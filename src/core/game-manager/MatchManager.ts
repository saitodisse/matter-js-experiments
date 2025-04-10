/**
 * MatchManager.ts
 *
 * Manages the state and logic for the overall game match, including multiple rounds,
 * match scoring, history, and interaction with ranking and UI for match-level events.
 */
import Matter from "matter-js"; // Import Matter for Body type
import { UIManager } from "./UIManager";
import { RankingManager } from "./RankingManager";
import { RoundManager } from "./RoundManager"; // To get round stats
import { DebugControl } from "../../components/DebugControl";
import {
    GameMode,
    MatchLengthMode,
    RankingEntry1P,
    RankingEntry2PIndividual,
    RoundResult,
} from "./types";

export class MatchManager {
    private uiManager: UIManager;
    private rankingManager: RankingManager;
    private roundManager!: RoundManager; // Will be set via setter
    private debugControl?: DebugControl;
    private restartCallback: (() => void) | null = null;

    // Match State
    private gameMode: GameMode | null = null;
    private matchLengthMode: MatchLengthMode = MatchLengthMode.BestOf7; // Default to Best of 7
    private player1RoundsWon: number = 0;
    private player2RoundsWon: number = 0;
    private currentRoundNumber: number = 1;
    private startingPlayerThisRound: 1 | 2 = 1;
    private roundHistory: RoundResult[] = [];
    private totalMatchScore1P: number = 0; // Total accuracy-based score in 1P match
    private totalMatchScoreP1_2P: number = 0; // Total accuracy-based score for P1 in 2P match
    private totalMatchScoreP2_2P: number = 0; // Total accuracy-based score for P2 in 2P match
    private isMatchOver: boolean = false;

    constructor(
        uiManager: UIManager,
        rankingManager: RankingManager,
    ) {
        this.uiManager = uiManager;
        this.rankingManager = rankingManager;
    }

    public setDependencies(
        roundManager: RoundManager,
        restartCallback: () => void,
        debugControl?: DebugControl,
    ): void {
        this.roundManager = roundManager;
        this.restartCallback = restartCallback;
        this.debugControl = debugControl;
    }

    public setGameMode(mode: GameMode): void {
        this.gameMode = mode;
        this.roundManager.setGameMode(mode); // Inform RoundManager too
    }

    /**
     * Sets the match length mode (Best of 3, 5, or 7).
     */
    public setMatchLengthMode(mode: MatchLengthMode): void {
        this.matchLengthMode = mode;
        this.debugControl?.logEvent("MatchState", {
            message: `Match length mode set to ${mode}.`,
        });
    }

    /**
     * Starts a new match, resetting all match and round states.
     */
    public startNewMatch(): void {
        if (!this.gameMode) {
            this.debugControl?.logEvent("GameWarning", {
                context: "startNewMatch",
                message: "Cannot start match without a game mode selected.",
            });
            // Consider showing start modal again? GameManager should handle this.
            return;
        }
        this.debugControl?.logEvent("MatchState", {
            message: "Starting new match.",
        });
        this.resetMatchState();
        this.roundManager.setCurrentRoundNumber(this.currentRoundNumber);
        this.roundManager.resetRoundState(this.startingPlayerThisRound);
        this.updateUI(); // Initial UI for the match/round
        if (this.restartCallback) {
            this.restartCallback(); // Trigger board reset for round 1
        } else {
            this.debugControl?.logEvent("GameWarning", {
                context: "startNewMatch",
                message: "Restart callback not set.",
            });
        }
    }

    /**
     * Resets the state for a new match.
     */
    private resetMatchState(): void {
        this.player1RoundsWon = 0;
        this.player2RoundsWon = 0;
        this.currentRoundNumber = 1;
        this.startingPlayerThisRound = 1; // P1 always starts match
        this.isMatchOver = false;
        this.roundHistory = [];
        this.totalMatchScore1P = 0;
        this.totalMatchScoreP1_2P = 0;
        this.totalMatchScoreP2_2P = 0;
        this.uiManager.hideMatchOverModal(); // Ensure modal is hidden
        this.debugControl?.logEvent("MatchState", {
            message: "Match state reset.",
        });
    }

    /**
     * Handles the logic when a round ends. Called by RoundManager via GameManager.
     * @param scoringPlayer The player who pocketed the last shape.
     */
    public handleRoundEnd(scoringPlayer: 1 | 2): void {
        if (this.isMatchOver) return; // Prevent actions after match end

        this.debugControl?.logEvent("RoundState", {
            message:
                `Handling end of Round ${this.currentRoundNumber}. Last scorer: Player ${scoringPlayer}`,
            round: this.currentRoundNumber,
        });

        this.recordRoundResult(); // Record result *before* potentially incrementing round number

        // Determine round winner
        if (this.gameMode === "single") {
            this.player1RoundsWon++;
            this.debugControl?.logEvent("RoundWin", {
                round: this.currentRoundNumber,
                winner: "Player 1 (Single Player)",
                scoreP1: this.player1RoundsWon,
                scoreP2: this.player2RoundsWon,
            });
        } else { // Two-player mode
            const winner = scoringPlayer; // Winner is the one who scored the last point
            if (winner === 1) this.player1RoundsWon++;
            else this.player2RoundsWon++;
            this.debugControl?.logEvent("RoundWin", {
                round: this.currentRoundNumber,
                winner,
                scoreP1: this.player1RoundsWon,
                scoreP2: this.player2RoundsWon,
            });
        }

        this.updateUI(); // Update scores before potential modal
        // Play sound via GameManager/AudioManager if needed (e.g., round end sound)
        // this.audioManager.playSound("doorClose_4", 1.0); // Moved to GameManager maybe?

        // Check if the match is over
        if (this.checkMatchOver()) {
            this.isMatchOver = true;
            this.debugControl?.logEvent("MatchState", {
                message: "Match over condition met.",
                finalScoreP1: this.player1RoundsWon,
                finalScoreP2: this.player2RoundsWon,
            });
            this.showMatchOverModal();
        } else {
            // Match not over, set up the next round
            this.prepareNextRound();
        }
    }

    /**
     * Records the result of the completed round. Calculates accuracy-based scores.
     */
    private recordRoundResult(): void {
        if (!this.gameMode) return;

        const roundStats = this.roundManager.getCurrentRoundStats();
        let roundData: RoundResult;

        if (this.gameMode === "single") {
            const accuracy = roundStats.attemptsP1 > 0
                ? (roundStats.scoreP1 / roundStats.attemptsP1)
                : 0;
            const roundScore = Math.min(100, Math.round(accuracy * 100));
            roundData = {
                round: this.currentRoundNumber,
                scoreP1: roundStats.scoreP1,
                attemptsP1: roundStats.attemptsP1,
                roundScore1P: roundScore,
            };
            this.totalMatchScore1P += roundScore;
            this.debugControl?.logEvent("RoundRecord", {
                mode: "single",
                round: this.currentRoundNumber,
                score: roundStats.scoreP1,
                attempts: roundStats.attemptsP1,
                roundScore: roundScore,
                totalMatchScore: this.totalMatchScore1P,
            });
        } else { // 'two'
            const accuracyP1 = roundStats.attemptsP1 > 0
                ? (roundStats.scoreP1 / roundStats.attemptsP1)
                : 0;
            const roundScoreP1 = Math.min(100, Math.round(accuracyP1 * 100));
            const accuracyP2 = roundStats.attemptsP2 > 0
                ? (roundStats.scoreP2 / roundStats.attemptsP2)
                : 0;
            const roundScoreP2 = Math.min(100, Math.round(accuracyP2 * 100));
            roundData = {
                round: this.currentRoundNumber,
                scoreP1: roundStats.scoreP1,
                attemptsP1: roundStats.attemptsP1,
                scoreP2: roundStats.scoreP2,
                attemptsP2: roundStats.attemptsP2,
                roundScoreP1_2P: roundScoreP1,
                roundScoreP2_2P: roundScoreP2,
            };
            this.totalMatchScoreP1_2P += roundScoreP1;
            this.totalMatchScoreP2_2P += roundScoreP2;
            this.debugControl?.logEvent("RoundRecord", {
                mode: "two",
                round: this.currentRoundNumber,
                scoreP1: roundStats.scoreP1,
                attemptsP1: roundStats.attemptsP1,
                roundScoreP1: roundScoreP1,
                totalMatchScoreP1: this.totalMatchScoreP1_2P,
                scoreP2: roundStats.scoreP2,
                attemptsP2: roundStats.attemptsP2,
                roundScoreP2: roundScoreP2,
                totalMatchScoreP2: this.totalMatchScoreP2_2P,
            });
        }
        this.roundHistory.push(roundData);
    }

    /**
     * Checks if the match is over based on the selected match length mode.
     */
    private checkMatchOver(): boolean {
        let requiredWins = 4; // Default for Best of 7

        // Determine required wins based on match length mode
        if (this.matchLengthMode === MatchLengthMode.BestOf3) {
            requiredWins = 2; // Best of 3 requires 2 wins
        } else if (this.matchLengthMode === MatchLengthMode.BestOf5) {
            requiredWins = 3; // Best of 5 requires 3 wins
        } else if (this.matchLengthMode === MatchLengthMode.BestOf7) {
            requiredWins = 4; // Best of 7 requires 4 wins
        }

        const matchOver = this.player1RoundsWon === requiredWins ||
            this.player2RoundsWon === requiredWins;

        if (matchOver) {
            this.debugControl?.logEvent("MatchCheck", {
                message: "Match over condition check returned true.",
                matchLengthMode: this.matchLengthMode,
                requiredWins: requiredWins,
                scoreP1: this.player1RoundsWon,
                scoreP2: this.player2RoundsWon,
            });
        }
        return matchOver;
    }

    /**
     * Prepares data and shows the match over modal via UIManager.
     */
    private showMatchOverModal(): void {
        // Ensure the last round's result is recorded if match ends abruptly (safeguard)
        if (
            this.roundHistory.length < this.currentRoundNumber && this.gameMode
        ) {
            this.debugControl?.logEvent("MatchState", {
                message: "Recording final round result before showing modal.",
            });
            this.recordRoundResult();
        }

        let canSaveScoreP1 = false;
        let canSaveScoreP2 = false;
        let rankingData: RankingEntry1P[] | RankingEntry2PIndividual[];

        if (this.gameMode === "single") {
            canSaveScoreP1 = this.rankingManager.isTopScore1P(
                this.totalMatchScore1P,
                this.matchLengthMode
            );
            rankingData = this.rankingManager.getRanking1P(this.matchLengthMode);
            this.debugControl?.logEvent("RankingCheck", {
                mode: "1P",
                matchMode: this.matchLengthMode,
                score: this.totalMatchScore1P,
                canSave: canSaveScoreP1,
            });
        } else { // two
            canSaveScoreP1 = this.rankingManager.isTopScore2PIndividual(
                this.totalMatchScoreP1_2P,
                this.matchLengthMode
            );
            canSaveScoreP2 = this.rankingManager.isTopScore2PIndividual(
                this.totalMatchScoreP2_2P,
                this.matchLengthMode
            );
            rankingData = this.rankingManager.getRanking2PIndividual(this.matchLengthMode);
            this.debugControl?.logEvent("RankingCheck", {
                mode: "2P",
                matchMode: this.matchLengthMode,
                scoreP1: this.totalMatchScoreP1_2P,
                canSaveP1: canSaveScoreP1,
                scoreP2: this.totalMatchScoreP2_2P,
                canSaveP2: canSaveScoreP2,
            });
        }

        this.uiManager.showMatchOverModal(
            this.gameMode!,
            this.player1RoundsWon,
            this.player2RoundsWon,
            this.totalMatchScore1P, // Still needed for display in 1P
            this.totalMatchScoreP1_2P, // Pass P1 score for 2P
            this.totalMatchScoreP2_2P, // Pass P2 score for 2P
            this.roundHistory,
            rankingData,
            canSaveScoreP1, // Pass flag for P1
            canSaveScoreP2, // Pass flag for P2 (relevant in 2P)
            this.matchLengthMode // Pass the match length mode
        );
    }

    /**
     * Handles saving the score by calling the RankingManager.
     * Called by GameManager after UIManager callback.
     */
    public handleSaveScore(name1: string, name2?: string): void {
        let updatedRankingData: RankingEntry1P[] | RankingEntry2PIndividual[];

        if (this.gameMode === "single") {
            updatedRankingData = this.rankingManager.saveRanking1P(
                name1,
                this.totalMatchScore1P,
                this.matchLengthMode
            );
        } else if (this.gameMode === "two" && name2) { // Ensure name2 exists for 2P
            // Save both players, update ranking data after both saves potentially finish
            this.rankingManager.saveRanking2PIndividual(
                name1,
                this.totalMatchScoreP1_2P,
                this.matchLengthMode
            );
            this.rankingManager.saveRanking2PIndividual(
                name2,
                this.totalMatchScoreP2_2P,
                this.matchLengthMode
            );
            updatedRankingData = this.rankingManager.getRanking2PIndividual(this.matchLengthMode); // Re-fetch after saving both
        } else {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Invalid state for saving score in MatchManager",
                mode: this.gameMode,
                matchMode: this.matchLengthMode,
                name1,
                name2,
            });
            return; // Don't proceed if state is invalid
        }

        // Update ranking display in the modal immediately after saving
        this.uiManager.updateRankingDisplay(
            updatedRankingData,
            this.gameMode === "two",
            this.matchLengthMode
        );

        this.debugControl?.logEvent("Ranking", {
            message: "Score save handled by MatchManager.",
            mode: this.gameMode,
            matchMode: this.matchLengthMode
        });
    }

    /**
     * Sets up the next round.
     */
    private prepareNextRound(): void {
        this.currentRoundNumber++;
        this.startingPlayerThisRound = this.startingPlayerThisRound === 1
            ? 2
            : 1; // Alternate starter

        this.debugControl?.logEvent("RoundState", {
            message: `Preparing for next round: ${this.currentRoundNumber}.`,
            nextRound: this.currentRoundNumber,
            startingPlayer: this.startingPlayerThisRound,
        });

        this.roundManager.setCurrentRoundNumber(this.currentRoundNumber);
        this.roundManager.resetRoundState(this.startingPlayerThisRound); // Reset round state for the new starting player
        this.updateUI(); // Update round number display etc.

        if (this.restartCallback) {
            this.restartCallback(); // Reset board
        } else {
            this.debugControl?.logEvent("GameWarning", {
                context: "prepareNextRound",
                message: "Restart callback not set.",
            });
        }
    }

    /**
     * Restarts the current round due to premature pocketing.
     * Resets round state and triggers board reset.
     * @param _prematurelyPocketedBody - The body that caused the issue (optional, for logging).
     */
    public restartCurrentRound(_prematurelyPocketedBody?: Matter.Body): void {
        if (this.isMatchOver) return; // Don't restart if match is already over

        this.debugControl?.logEvent("RoundRestart", {
            message:
                `Restarting current round (${this.currentRoundNumber}) due to premature pocketing.`,
            round: this.currentRoundNumber,
            startingPlayer: this.startingPlayerThisRound, // Keep the same starter
            // bodyId: _prematurelyPocketedBody?.id // Optional logging
        });

        // Reset the round state using the *same* starting player
        this.roundManager.resetRoundState(this.startingPlayerThisRound);
        this.updateUI(); // Update UI to reflect reset state

        // Trigger the board reset
        if (this.restartCallback) {
            this.restartCallback();
        } else {
            this.debugControl?.logEvent("GameWarning", {
                context: "restartCurrentRound",
                message: "Restart callback not set.",
            });
        }
    }

    /**
     * Updates UI elements related to the match state (round number, match score).
     */
    private updateUI(): void {
        this.uiManager.updateRoundScoreDisplay(
            this.gameMode!,
            this.currentRoundNumber,
            this.player1RoundsWon, // Pass P1 rounds for 1P display logic
        );
        this.uiManager.updateMatchScoreDisplay(
            this.gameMode!,
            this.player1RoundsWon,
            this.player2RoundsWon,
        );
        // Round-specific UI (score/attempts/turn) is updated by RoundManager.updateUI()
    }

    // --- Getters ---
    public getCurrentRoundNumber(): number {
        return this.currentRoundNumber;
    }

    public getGameMode(): GameMode {
        if (!this.gameMode) {
            this.debugControl?.logEvent("GameWarning", {
                context: "getGameMode",
                message: "Game mode not set. Defaulting to Single Player.",
            });
            return GameMode.Single;
        }
        return this.gameMode;
    }

    public getIsMatchOver(): boolean {
        return this.isMatchOver;
    }

    public getMatchLengthMode(): MatchLengthMode {
        return this.matchLengthMode;
    }
}
