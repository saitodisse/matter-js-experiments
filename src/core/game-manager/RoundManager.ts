/**
 * RoundManager.ts
 *
 * Manages the state and logic for a single round of the game.
 */
import Matter from "matter-js";
import { Engine } from "../Engine";
import { AudioManager } from "../AudioManager";
import { UIManager } from "./UIManager";
import { DebugControl } from "../../components/DebugControl";
import { GameMode } from "./types";
import { CATEGORY_EFFECT_PARTICLE } from "../../types"; // Import particle category

export class RoundManager {
    private engine: Engine | null = null;
    private audioManager: AudioManager;
    private uiManager: UIManager;
    private debugControl?: DebugControl;
    private onRoundEndCallback: (scoringPlayer: 1 | 2) => void;

    // Round State
    private gameMode: GameMode | null = null;
    private score: number = 0; // Single player score per round
    private attempts: number = 0; // Single player attempts per round
    private player1Score: number = 0; // Player 1 score per round
    private player2Score: number = 0; // Player 2 score per round
    private player1Attempts: number = 0; // Player 1 attempts per round
    private player2Attempts: number = 0; // Player 2 attempts per round
    private firstAttemptMade: boolean = false;
    private lastPlayerToAttempt: 1 | 2 = 1;
    private currentPlayer: 1 | 2 = 1;
    private startingPlayerThisRound: 1 | 2 = 1;
    private initialBodyCount: number = 0;
    private currentRoundNumber: number = 1; // Needed for logging

    constructor(
        audioManager: AudioManager,
        uiManager: UIManager,
        onRoundEndCallback: (scoringPlayer: 1 | 2) => void,
    ) {
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.onRoundEndCallback = onRoundEndCallback;
    }

    public setDependencies(
        engine: Engine,
        debugControl?: DebugControl,
    ): void {
        this.engine = engine;
        this.debugControl = debugControl;
    }

    public setGameMode(mode: GameMode): void {
        this.gameMode = mode;
    }

    public setCurrentRoundNumber(round: number): void {
        this.currentRoundNumber = round;
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
     * Resets the state specific to the beginning of a round.
     * @param startingPlayer The player who starts this round.
     */
    public resetRoundState(startingPlayer: 1 | 2): void {
        this.score = 0;
        this.player1Score = 0;
        this.player2Score = 0;
        this.attempts = 0;
        this.player1Attempts = 0;
        this.player2Attempts = 0;
        this.firstAttemptMade = false;
        this.lastPlayerToAttempt = 1; // Reset last attempter
        this.startingPlayerThisRound = startingPlayer;
        this.currentPlayer = startingPlayer;
        this.initialBodyCount = 0; // Reset for the new round, will be set again
        this.debugControl?.logEvent("RoundState", {
            message: `Round state reset. Player ${this.currentPlayer} starts.`,
            round: this.currentRoundNumber,
        });
        this.updateUI(); // Update UI after reset
    }

    /**
     * Increments the score (shapes pocketed), updates displays, and checks for round end.
     */
    public addScore(points: number = 1): void {
        if (!this.gameMode || !this.engine) return; // Match over check is now in MatchManager

        // Prevent scoring before the first shot (could happen due to physics settling)
        if (!this.firstAttemptMade) {
            this.debugControl?.logEvent("GameWarning", {
                message:
                    "Score added before first attempt in round. Ignoring score.",
                round: this.currentRoundNumber,
            });
            // Consider if resetting the round is necessary here, or just ignoring.
            // For now, just ignore the score. A reset might be too disruptive.
            return;
        }

        const scoringPlayer = this.lastPlayerToAttempt;
        if (this.gameMode === GameMode.Single) {
            this.score += points;
            this.debugControl?.logEvent("PlayerAction", {
                action: "score",
                mode: "single",
                value: this.score,
                round: this.currentRoundNumber,
            });
        } else if (this.gameMode === GameMode.Two) {
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

        // Check for Round End (with delay to allow physics to settle)
        setTimeout(() => {
            this.checkRoundEndCondition(scoringPlayer);
        }, 50);
    }

    /**
     * Checks if all non-static bodies are cleared.
     */
    private checkRoundEndCondition(scoringPlayer: 1 | 2): void {
        if (!this.engine) return; // Match over check is now in MatchManager

        const nonStaticBodies = Matter.Composite.allBodies(
            this.engine.getWorld(),
        ).filter((body) =>
            !body.isStatic &&
            body.collisionFilter?.category !== CATEGORY_EFFECT_PARTICLE // Exclude effect particles
        );
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
            this.debugControl?.logEvent("RoundState", {
                message:
                    `Round ${this.currentRoundNumber} clear condition met! Notifying MatchManager.`,
                round: this.currentRoundNumber,
            });
            this.onRoundEndCallback(scoringPlayer); // Notify GameManager/MatchManager
        }
    }

    /**
     * Increments the number of attempts, stores the attempting player, and switches player in two-player mode
     */
    public addAttempt(count: number = 1): void {
        if (!this.gameMode) return; // Match over check is now in MatchManager

        if (!this.firstAttemptMade) {
            this.firstAttemptMade = true;
            this.debugControl?.logEvent("RoundState", {
                message: "First attempt registered for this round.",
                round: this.currentRoundNumber,
            });
        }

        if (this.gameMode === GameMode.Single) {
            this.attempts += count;
            this.debugControl?.logEvent("PlayerAction", {
                action: "attempt",
                mode: "single",
                value: this.attempts,
                round: this.currentRoundNumber,
            });
            this.lastPlayerToAttempt = 1;
        } else if (this.gameMode === GameMode.Two) {
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
     * Updates the UI elements related to the round state.
     */
    private updateUI(): void {
        if (this.gameMode === null) {
            this.debugControl?.logEvent("UIWarning", {
                message: "updateUI called with null gameMode. Skipping.",
                round: this.currentRoundNumber,
            });
            return; // Don't update UI if game mode isn't set
        }
        // Note: Round number and match score are handled by MatchManager/UIManager directly
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

    // --- Getters for MatchManager ---
    public getCurrentRoundStats() {
        return {
            scoreP1: this.gameMode === GameMode.Single
                ? this.score
                : this.player1Score,
            attemptsP1: this.gameMode === GameMode.Single
                ? this.attempts
                : this.player1Attempts,
            scoreP2: this.player2Score,
            attemptsP2: this.player2Attempts,
        };
    }

    public getCurrentPlayer(): 1 | 2 {
        return this.currentPlayer;
    }

    public getStartingPlayer(): 1 | 2 {
        return this.startingPlayerThisRound;
    }

    public isFirstAttemptMade(): boolean {
        return this.firstAttemptMade;
    }
}
