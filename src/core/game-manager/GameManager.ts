/**
 * GameManager.ts (Refactored)
 *
 * Centralizes game state, orchestrates UI, Ranking, and Audio managers,
 * and handles core game logic like scoring, attempts, and round/match progression.
 */
import Matter from "matter-js";
import { Engine } from "../Engine"; // Assuming Engine remains in core
import { AudioManager } from "../AudioManager"; // Assuming AudioManager remains in core
import { DebugControl } from "../../components/DebugControl";
import { UIManager } from "./UIManager";
import { RankingManager } from "./RankingManager";
import { GameMode, GameResetType, RoundResult } from "./types";

export class GameManager {
    // Singleton instance
    private static instance: GameManager;

    // Managers
    private audioManager: AudioManager;
    private uiManager: UIManager;
    private rankingManager: RankingManager;
    private debugControl?: DebugControl;

    // Engine Reference
    private engine: Engine | null = null;

    // Game Mode & State
    private gameMode: GameMode = null;
    private currentPlayer: 1 | 2 = 1;
    private lastPlayerToAttempt: 1 | 2 = 1;
    private isMatchOver: boolean = false;

    // Round State
    private score: number = 0; // Single player score per round
    private attempts: number = 0; // Single player attempts per round
    private player1Score: number = 0; // Player 1 score per round
    private player2Score: number = 0; // Player 2 score per round
    private player1Attempts: number = 0; // Player 1 attempts per round
    private player2Attempts: number = 0; // Player 2 attempts per round
    private firstAttemptMade: boolean = false;

    // Match State
    private player1RoundsWon: number = 0;
    private player2RoundsWon: number = 0;
    private currentRoundNumber: number = 1;
    private startingPlayerThisRound: 1 | 2 = 1;
    private roundHistory: RoundResult[] = [];
    private totalMatchScore1P: number = 0; // Total accuracy-based score in 1P match
    private totalMatchScoreP1_2P: number = 0; // Total accuracy-based score for P1 in 2P match
    private totalMatchScoreP2_2P: number = 0; // Total accuracy-based score for P2 in 2P match

    // Other State
    private initialBodyCount: number = 0;
    private restartCallback: (() => void) | null = null;

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        this.audioManager = new AudioManager(); // Instantiate AudioManager first
        this.rankingManager = new RankingManager();
        // Pass callbacks to UIManager
        this.uiManager = new UIManager(
            this.audioManager,
            this.startGame.bind(this), // Bind 'this' for callbacks
            () => this.resetGame("fullMatchRestart"), // Restart match callback
            this.handleSaveScore.bind(this), // Save score callback
        );
        this.preloadSounds();
        this.uiManager.showGameStartModal(); // Show initial modal
        this.updateUI(); // Initial UI update
    }

    /**
     * Gets the singleton instance of GameManager
     */
    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    /**
     * Sets the DebugControl instance for logging.
     */
    public setDebugControl(debugControl: DebugControl): void {
        this.debugControl = debugControl;
        this.audioManager.setDebugControl(debugControl);
        this.uiManager.setDebugControl(debugControl);
        this.rankingManager.setDebugControl(debugControl);
    }

    /**
     * Sets the engine reference
     */
    public setEngine(engine: Engine): void {
        this.engine = engine;
    }

    /**
     * Sets the callback function for restarting the game board (called by Engine/main)
     */
    public setRestartCallback(callback: () => void): void {
        this.restartCallback = callback;
    }

    /**
     * Sets the initial count of non-static bodies for the round
     */
    public setInitialBodyCount(count: number): void {
        this.initialBodyCount = count;
        this.debugControl?.logEvent("GameState", {
            message: `Initial body count set to: ${count}`,
            round: this.currentRoundNumber,
        });
    }

    /**
     * Preloads necessary game sounds
     */
    private preloadSounds(): void {
        // Simplified - actual paths might need adjustment based on final structure
        const soundUrls = [
            {
                id: "hit",
                url: `${import.meta.env.BASE_URL}sounds/hammer-hitting-a-head-100624.mp3`,
            },
            { id: "hit_01", url: "/sounds/hit_01.ogg" },
            { id: "plop_01", url: "/sounds/plop_01.ogg" },
            { id: "plop_02", url: "/sounds/plop_02.ogg" },
            { id: "pop", url: "/sounds/pop.ogg" },
            { id: "wooden_01", url: "/sounds/wooden_01.ogg" },
            { id: "doorClose_4", url: "/sounds/doorClose_4.ogg" },
        ];

        soundUrls.forEach((sound) => {
            this.audioManager.loadSound(sound.id, sound.url)
                .catch((error) => {
                    const message = `Failed to preload ${sound.url}`;
                    console.error(message, error);
                    this.debugControl?.logEvent("AudioError", {
                        message,
                        error,
                    });
                });
        });
    }

    /**
     * Starts the game in the selected mode (callback from UIManager)
     */
    private startGame(mode: GameMode): void {
        if (!mode) return;
        this.gameMode = mode;
        this.resetGame("fullMatchRestart"); // Reset stats for the new match
        this.uiManager.hideGameStartModal();
        this.debugControl?.logEvent("GameState", {
            message: `Game started in ${mode} player mode.`,
        });
        // Engine start is likely handled externally (e.g., in main.ts)
    }

    /**
     * Updates all relevant UI elements based on the current game state.
     */
    private updateUI(): void {
        this.uiManager.updateRoundScoreDisplay(
            this.gameMode,
            this.currentRoundNumber,
            this.player1RoundsWon,
        );
        this.uiManager.updateMatchScoreDisplay(
            this.gameMode,
            this.player1RoundsWon,
            this.player2RoundsWon,
        );
        this.uiManager.updateScoreDisplay(
            this.gameMode,
            this.currentPlayer,
            this.score,
            this.attempts, // 1P
            this.player1Score,
            this.player1Attempts, // 2P P1
            this.player2Score,
            this.player2Attempts, // 2P P2
        );
    }

    /**
     * Increments the score (shapes pocketed), updates displays, and checks for round/match end.
     */
    public addScore(points: number = 1): void {
        if (!this.gameMode || this.isMatchOver || !this.engine) return;
        if (!this.firstAttemptMade) {
            this.debugControl?.logEvent("GameWarning", {
                message:
                    "Score added before first attempt. Restarting current round.",
            });
            this.resetGame("currentRoundRestart");
            return;
        }

        const scoringPlayer = this.lastPlayerToAttempt;
        if (this.gameMode === "single") {
            this.score += points;
            this.debugControl?.logEvent("PlayerAction", {
                action: "score",
                mode: "single",
                value: this.score,
                round: this.currentRoundNumber,
            });
        } else if (this.gameMode === "two") {
            if (scoringPlayer === 1) {
                this.player1Score += points;
                this.debugControl?.logEvent("PlayerAction", {
                    action: "score",
                    mode: "two",
                    player: 1,
                    value: this.player1Score,
                    round: this.currentRoundNumber,
                });
            } else {
                this.player2Score += points;
                this.debugControl?.logEvent("PlayerAction", {
                    action: "score",
                    mode: "two",
                    player: 2,
                    value: this.player2Score,
                    round: this.currentRoundNumber,
                });
            }
        }
        this.updateUI();
        this.audioManager.playSound("plop_02", 0.8);

        // Check for Round/Match End (with delay)
        setTimeout(() => {
            if (!this.engine || this.isMatchOver) return;

            const nonStaticBodies = Matter.Composite.allBodies(
                this.engine.getWorld(),
            ).filter((body) => !body.isStatic);
            const bodiesRemaining = nonStaticBodies.length;

            this.debugControl?.logEvent("CheckRoundOverValues", {
                nonStaticBodiesCount: bodiesRemaining,
                initialBodyCount: this.initialBodyCount,
                firstAttemptMade: this.firstAttemptMade,
                conditionMet: bodiesRemaining === 0 &&
                    this.initialBodyCount > 0 && this.firstAttemptMade,
                round: this.currentRoundNumber,
            });

            if (
                bodiesRemaining === 0 && this.initialBodyCount > 0 &&
                this.firstAttemptMade
            ) {
                this.handleRoundEnd(scoringPlayer);
            }
        }, 50);
    }

    /**
     * Handles the logic when a round ends (all bodies cleared).
     */
    private handleRoundEnd(scoringPlayer: 1 | 2): void {
        this.debugControl?.logEvent("RoundState", {
            message: `Round ${this.currentRoundNumber} clear condition met!`,
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

        this.updateUI();
        this.audioManager.playSound("doorClose_4", 1.0);

        // Check if the match is over
        if (this.checkMatchOver()) {
            this.isMatchOver = true;
            this.debugControl?.logEvent("MatchState", {
                message: "Match over condition met.",
                finalScoreP1: this.player1RoundsWon,
                finalScoreP2: this.player2RoundsWon,
            });
            this.showMatchOverModal(); // Call method to prepare and show modal
        } else {
            // Match not over, set up the next round
            this.debugControl?.logEvent("RoundState", {
                message: "Proceeding to next round setup.",
                nextRound: this.currentRoundNumber + 1,
            });
            this.resetGame("nextRoundSetup");
        }
    }

    /**
     * Increments the number of attempts, stores the attempting player, and switches player in two-player mode
     */
    public addAttempt(count: number = 1): void {
        if (!this.gameMode || this.isMatchOver) return;

        if (!this.firstAttemptMade) {
            this.firstAttemptMade = true;
            this.debugControl?.logEvent("RoundState", {
                message: "First attempt registered for this round.",
                round: this.currentRoundNumber,
            });
        }

        if (this.gameMode === "single") {
            this.attempts += count;
            this.debugControl?.logEvent("PlayerAction", {
                action: "attempt",
                mode: "single",
                value: this.attempts,
                round: this.currentRoundNumber,
            });
            this.lastPlayerToAttempt = 1;
        } else if (this.gameMode === "two") {
            this.lastPlayerToAttempt = this.currentPlayer; // Store before switching
            if (this.currentPlayer === 1) {
                this.player1Attempts += count;
                this.debugControl?.logEvent("PlayerAction", {
                    action: "attempt",
                    mode: "two",
                    player: 1,
                    value: this.player1Attempts,
                    round: this.currentRoundNumber,
                });
            } else {
                this.player2Attempts += count;
                this.debugControl?.logEvent("PlayerAction", {
                    action: "attempt",
                    mode: "two",
                    player: 2,
                    value: this.player2Attempts,
                    round: this.currentRoundNumber,
                });
            }
            // Switch player turn
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.debugControl?.logEvent("GameState", {
                message: `Switched turn to Player ${this.currentPlayer}`,
                round: this.currentRoundNumber,
            });
        }
        this.updateUI();
    }

    /**
     * Records the result of the completed round. Calculates accuracy-based scores.
     */
    private recordRoundResult(): void {
        if (!this.gameMode) return;

        let roundData: RoundResult;
        if (this.gameMode === "single") {
            const accuracy = this.attempts > 0
                ? (this.score / this.attempts)
                : 0;
            const roundScore = Math.min(100, Math.round(accuracy * 100));
            roundData = {
                round: this.currentRoundNumber,
                scoreP1: this.score,
                attemptsP1: this.attempts,
                roundScore1P: roundScore,
            };
            this.totalMatchScore1P += roundScore;
            this.debugControl?.logEvent("RoundRecord", {
                mode: "single",
                round: this.currentRoundNumber,
                score: this.score,
                attempts: this.attempts,
                roundScore: roundScore,
                totalMatchScore: this.totalMatchScore1P,
            });
        } else { // 'two'
            const accuracyP1 = this.player1Attempts > 0
                ? (this.player1Score / this.player1Attempts)
                : 0;
            const roundScoreP1 = Math.min(100, Math.round(accuracyP1 * 100));
            const accuracyP2 = this.player2Attempts > 0
                ? (this.player2Score / this.player2Attempts)
                : 0;
            const roundScoreP2 = Math.min(100, Math.round(accuracyP2 * 100));
            roundData = {
                round: this.currentRoundNumber,
                scoreP1: this.player1Score,
                attemptsP1: this.player1Attempts,
                scoreP2: this.player2Score,
                attemptsP2: this.player2Attempts,
                roundScoreP1_2P: roundScoreP1,
                roundScoreP2_2P: roundScoreP2,
            };
            this.totalMatchScoreP1_2P += roundScoreP1;
            this.totalMatchScoreP2_2P += roundScoreP2;
            this.debugControl?.logEvent("RoundRecord", {
                mode: "two",
                round: this.currentRoundNumber,
                scoreP1: this.player1Score,
                attemptsP1: this.player1Attempts,
                roundScoreP1: roundScoreP1,
                totalMatchScoreP1: this.totalMatchScoreP1_2P,
                scoreP2: this.player2Score,
                attemptsP2: this.player2Attempts,
                roundScoreP2: roundScoreP2,
                totalMatchScoreP2: this.totalMatchScoreP2_2P,
            });
        }
        this.roundHistory.push(roundData);
    }

    /**
     * Checks if the match is over (Best of 7 condition met).
     */
    private checkMatchOver(): boolean {
        const matchOver = this.player1RoundsWon === 4 ||
            this.player2RoundsWon === 4;
        if (matchOver) {
            this.debugControl?.logEvent("MatchCheck", {
                message: "Match over condition check returned true.",
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
        // Ensure the last round's result is recorded if match ends abruptly
        if (
            this.roundHistory.length < this.currentRoundNumber &&
            this.gameMode && !this.isMatchOver
        ) {
            // This check might be redundant if called only after checkMatchOver confirms true
            // but kept as a safeguard.
            this.recordRoundResult();
        }

        const rankingData = this.gameMode === "single"
            ? this.rankingManager.getRanking1P()
            : this.rankingManager.getRanking2PIndividual();

        this.uiManager.showMatchOverModal(
            this.gameMode,
            this.player1RoundsWon,
            this.player2RoundsWon,
            this.totalMatchScore1P, // Pass 1P total score
            this.roundHistory,
            rankingData,
        );
    }

    /**
     * Handles saving the score (callback from UIManager).
     */
    private handleSaveScore(name1: string, name2?: string): void {
        let updatedRankingData;
        if (this.gameMode === "single") {
            updatedRankingData = this.rankingManager.saveRanking1P(
                name1,
                this.totalMatchScore1P,
            );
        } else if (this.gameMode === "two" && name2) { // Ensure name2 exists for 2P
            // Save both players, update ranking data after both saves potentially finish
            this.rankingManager.saveRanking2PIndividual(
                name1,
                this.totalMatchScoreP1_2P,
            );
            this.rankingManager.saveRanking2PIndividual(
                name2,
                this.totalMatchScoreP2_2P,
            );
            updatedRankingData = this.rankingManager.getRanking2PIndividual(); // Re-fetch after saving both
        } else {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Invalid state for saving score",
                mode: this.gameMode,
                name1,
                name2,
            });
            return; // Don't proceed if state is invalid
        }

        // Update ranking display in the modal immediately after saving
        this.uiManager.updateRankingDisplay(
            updatedRankingData,
            this.gameMode === "two",
        );

        this.debugControl?.logEvent("Ranking", {
            message: "Score save handled.",
            mode: this.gameMode,
        });
    }

    /**
     * Resets the game state for either a new match or the next round.
     */
    public resetGame(resetType: GameResetType): void {
        this.debugControl?.logEvent("GameReset", { type: resetType });

        // --- Reset Round State (Common to 'nextRoundSetup' and 'currentRoundRestart') ---
        if (
            resetType === "nextRoundSetup" ||
            resetType === "currentRoundRestart"
        ) {
            this.score = 0;
            this.player1Score = 0;
            this.player2Score = 0;
            this.attempts = 0;
            this.player1Attempts = 0;
            this.player2Attempts = 0;
            this.firstAttemptMade = false;
            this.lastPlayerToAttempt = 1; // Reset last attempter
        }

        // --- Reset based on type ---
        if (resetType === "fullMatchRestart") {
            this.uiManager.hideMatchOverModal();
            // Don't reset gameMode here, keep the selected mode
            this.player1RoundsWon = 0;
            this.player2RoundsWon = 0;
            this.currentRoundNumber = 1;
            this.startingPlayerThisRound = 1; // P1 always starts match
            this.currentPlayer = 1;
            this.isMatchOver = false;
            this.roundHistory = [];
            this.totalMatchScore1P = 0;
            this.totalMatchScoreP1_2P = 0;
            this.totalMatchScoreP2_2P = 0;

            // Reset round state as well
            this.score = 0;
            this.attempts = 0;
            this.player1Score = 0;
            this.player1Attempts = 0;
            this.player2Score = 0;
            this.player2Attempts = 0;
            this.firstAttemptMade = false;
            this.lastPlayerToAttempt = 1;

            if (!this.gameMode) {
                this.uiManager.showGameStartModal(); // Show if no mode selected yet
            } else {
                // If mode exists, trigger board reset for round 1
                if (this.restartCallback) this.restartCallback();
                else {this.debugControl?.logEvent("GameWarning", {
                        context: "resetGame(fullMatchRestart)",
                        message: "Restart callback not set.",
                    });}
            }
        } else if (resetType === "nextRoundSetup") {
            this.currentRoundNumber++;
            this.startingPlayerThisRound = this.startingPlayerThisRound === 1
                ? 2
                : 1; // Alternate starter
            this.currentPlayer = this.startingPlayerThisRound;
            this.debugControl?.logEvent("RoundState", {
                message:
                    `Player ${this.currentPlayer} starts Round ${this.currentRoundNumber}.`,
                startingPlayer: this.startingPlayerThisRound,
            });

            if (this.restartCallback) this.restartCallback(); // Reset board
            else {this.debugControl?.logEvent("GameWarning", {
                    context: "resetGame(nextRoundSetup)",
                    message: "Restart callback not set.",
                });}
        } else if (resetType === "currentRoundRestart") {
            this.currentPlayer = this.startingPlayerThisRound; // Reset to who started this round
            this.debugControl?.logEvent("RoundState", {
                message:
                    `Restarting current round (${this.currentRoundNumber}). Player ${this.currentPlayer} starts.`,
            });

            if (this.restartCallback) this.restartCallback(); // Reset board
            else {this.debugControl?.logEvent("GameWarning", {
                    context: "resetGame(currentRoundRestart)",
                    message: "Restart callback not set.",
                });}
        }

        // --- Update UI (Common) ---
        this.updateUI();
    }

    /**
     * Gets the AudioManager instance.
     */
    public getAudioManager(): AudioManager {
        return this.audioManager;
    }

    // --- Getters for state (optional, if needed externally) ---
    public getCurrentPlayer(): 1 | 2 {
        return this.currentPlayer;
    }
    public getGameMode(): GameMode {
        return this.gameMode;
    }
    public isMatchInProgress(): boolean {
        return this.gameMode !== null && !this.isMatchOver;
    }
}
