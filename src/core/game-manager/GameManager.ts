/**
 * GameManager.ts (Refactored)
 *
 * Centralizes game setup, orchestrates managers (Audio, UI, Ranking, Round, Match),
 * and acts as the main entry point for game actions. (Singleton)
 */
import { Engine } from "../Engine";
import { AudioManager } from "../AudioManager";
import { DebugControl } from "../../components/DebugControl";
import { UIManager } from "./UIManager";
import { RankingManager } from "./RankingManager";
import { RoundManager } from "./RoundManager";
import { MatchManager } from "./MatchManager";
import Matter from "matter-js"; // Import Matter for Body type
import { GameMode, GameResetType, MatchLengthMode } from "./types"; // Keep GameResetType for now, might simplify

export class GameManager {
    // Singleton instance
    private static instance: GameManager;

    // Managers
    private audioManager: AudioManager;
    private uiManager: UIManager;
    private rankingManager: RankingManager;
    private roundManager: RoundManager;
    private matchManager: MatchManager;
    private debugControl?: DebugControl;

    // Engine Reference
    private engine: Engine | null = null;

    // Other State
    private restartCallback: (() => void) | null = null;
    private gameMode: GameMode | null = null; // Keep track of selected mode before match starts

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        // Instantiate core managers first
        this.audioManager = new AudioManager();
        this.rankingManager = new RankingManager();

        // Instantiate UI Manager, passing necessary callbacks that GameManager will mediate
        this.uiManager = new UIManager(
            this.audioManager,
            this.startGame.bind(this), // Start game callback
            () => this.resetGame("fullMatchRestart"), // Restart match callback (maps to full restart)
            this.handleSaveScore.bind(this), // Save score callback
        );

        // Instantiate Round and Match Managers
        // RoundManager needs a callback for when a round ends
        this.roundManager = new RoundManager(
            this.audioManager,
            this.uiManager,
            this.onRoundEnd.bind(this), // Callback when round condition met
        );

        this.matchManager = new MatchManager(
            this.uiManager,
            this.rankingManager,
        );

        // Initial setup
        this.preloadSounds();
        this.uiManager.showGameStartModal(); // Show initial modal
        // Initial UI update is handled by MatchManager.startNewMatch -> updateUI
    }

    /**
     * Gets the singleton instance of GameManager
     */
    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
            // Expose the instance globally for UI access
            (window as any).gameManagerInstance = GameManager.instance;
        }
        return GameManager.instance;
    }

    /**
     * Sets the DebugControl instance for logging and passes it to other managers.
     */
    public setDebugControl(debugControl: DebugControl): void {
        this.debugControl = debugControl;
        this.audioManager.setDebugControl(debugControl);
        this.uiManager.setDebugControl(debugControl);
        this.rankingManager.setDebugControl(debugControl);
        // Pass debug control to new managers via their setDependencies methods
        this.roundManager.setDependencies(this.engine!, this.debugControl); // Engine might not be set yet, handle in setEngine
        this.matchManager.setDependencies(
            this.roundManager,
            this.restartCallback!,
            this.debugControl,
        ); // restartCallback might not be set yet
        this.debugControl?.logEvent("System", {
            message: "DebugControl set for all managers.",
        });
    }

    /**
     * Sets the engine reference and passes it to managers that need it.
     */
    public setEngine(engine: Engine): void {
        this.engine = engine;
        // Pass engine to managers that need it (currently RoundManager)
        this.roundManager.setDependencies(this.engine, this.debugControl);
        this.debugControl?.logEvent("System", {
            message: "Engine reference set for GameManager and RoundManager.",
        });
    }

    /**
     * Sets the callback function for restarting the game board.
     */
    public setRestartCallback(callback: () => void): void {
        this.restartCallback = callback;
        // Pass callback to MatchManager
        this.matchManager.setDependencies(
            this.roundManager,
            this.restartCallback,
            this.debugControl,
        );
        this.debugControl?.logEvent("System", {
            message: "Restart callback set for MatchManager.",
        });
    }

    /**
     * Sets the initial count of non-static bodies for the round (delegated to RoundManager).
     */
    public setInitialBodyCount(count: number): void {
        // Delegate to RoundManager, MatchManager now controls round number state
        this.roundManager.setInitialBodyCount(count);
    }

    /**
     * Preloads necessary game sounds
     */
    private preloadSounds(): void {
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
            { id: "doorClose_4", url: "/sounds/doorClose_4.ogg" }, // Sound for round end
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
        this.debugControl?.logEvent("System", {
            message: "Preloading sounds.",
        });
    }

    /**
     * Sets the match length mode (Best of 3, 5, or 7).
     * This method is called by UIManager via the global instance.
     */
    public setMatchLengthMode(mode: MatchLengthMode): void {
        this.matchManager.setMatchLengthMode(mode);
        this.debugControl?.logEvent("GameState", {
            message: `Match length mode set to ${mode}.`,
        });
    }

    /**
     * Starts the game in the selected mode (callback from UIManager).
     * Sets up the MatchManager for a new match.
     */
    private startGame(mode: GameMode): void {
        if (!mode) return;
        this.debugControl?.logEvent("GameState", {
            message: `Attempting to start game in ${mode} player mode.`,
        });
        this.gameMode = mode; // Store selected mode
        this.matchManager.setGameMode(mode);
        this.matchManager.startNewMatch(); // This handles resetting state and starting round 1
        this.uiManager.hideGameStartModal();
    }

    /**
     * Callback from RoundManager when the round clear condition is met.
     * Delegates to MatchManager to handle round end logic.
     */
    private onRoundEnd(scoringPlayer: 1 | 2): void {
        if (this.matchManager.getIsMatchOver()) return; // Don't process if match already ended

        this.debugControl?.logEvent("GameState", {
            message:
                `GameManager received round end notification. Delegating to MatchManager.`,
            round: this.matchManager.getCurrentRoundNumber(), // Get round from MatchManager
            scoringPlayer: scoringPlayer,
        });
        this.audioManager.playSound("doorClose_4", 1.0); // Play round end sound here
        this.matchManager.handleRoundEnd(scoringPlayer);
    }

    /**
     * Handles saving the score (callback from UIManager). Delegates to MatchManager.
     */
    private handleSaveScore(name1: string, name2?: string): void {
        this.debugControl?.logEvent("GameState", {
            message:
                `GameManager received save score request. Delegating to MatchManager.`,
        });
        this.matchManager.handleSaveScore(name1, name2);
    }

    /**
     * Resets the game state. Currently only supports full match restart.
     */
    public resetGame(resetType: GameResetType): void {
        this.debugControl?.logEvent("GameReset", { type: resetType });

        if (resetType === "fullMatchRestart") {
            if (!this.gameMode) {
                this.debugControl?.logEvent("GameWarning", {
                    context: "resetGame",
                    message: "No game mode selected, showing start modal.",
                });
                this.uiManager.showGameStartModal(); // Show if no mode selected yet
            } else {
                this.debugControl?.logEvent("GameState", {
                    message:
                        `Performing full match restart for mode: ${this.gameMode}.`,
                });
                // Ensure the mode is set correctly before starting
                this.matchManager.setGameMode(this.gameMode);
                this.matchManager.startNewMatch(); // Start a fresh match
            }
        } else {
            this.debugControl?.logEvent("GameWarning", {
                context: "resetGame",
                message:
                    `Reset type '${resetType}' not fully supported or handled internally. Performing full restart.`,
            });
            // Default to full restart if other types are called unexpectedly
            this.resetGame("fullMatchRestart");
        }
    }

    // --- Delegated Actions ---

    /**
     * Increments the score (delegated to RoundManager).
     */
    public addScore(points: number = 1): void {
        if (this.matchManager.getIsMatchOver()) return;
        this.roundManager.addScore(points);
    }

    /**
     * Increments the number of attempts (delegated to RoundManager).
     */
    public addAttempt(count: number = 1): void {
        if (this.matchManager.getIsMatchOver()) return;
        this.roundManager.addAttempt(count);
    }

    // --- Getters ---

    /**
     * Gets the AudioManager instance.
     */
    public getAudioManager(): AudioManager {
        return this.audioManager;
    }

    /**
     * Gets the current player (delegated to RoundManager).
     */
    public getCurrentPlayer(): 1 | 2 {
        // RoundManager holds the current turn state
        return this.roundManager.getCurrentPlayer();
    }

    /**
     * Gets the current game mode (delegated to MatchManager).
     */
    public getGameMode(): GameMode {
        // MatchManager holds the overall game mode
        return this.matchManager.getGameMode();
    }

    /**
     * Checks if a match is currently in progress.
     */
    public isMatchInProgress(): boolean {
        return this.matchManager.getGameMode() !== null &&
            !this.matchManager.getIsMatchOver();
    }

    /**
     * Gets the current round number (delegated to MatchManager).
     */
    public getCurrentRoundNumber(): number {
        return this.matchManager.getCurrentRoundNumber();
    }

    /**
     * Checks if the first attempt has been made in the current round (delegated to RoundManager).
     */
    public isFirstAttemptMade(): boolean {
        return this.roundManager.isFirstAttemptMade();
    }

    /**
     * Handles the situation where a body is pocketed before the first attempt.
     * Delegates to MatchManager to restart the current round.
     * @param prematurelyPocketedBody The body that was pocketed too early.
     */
    public handlePrematurePocketing(
        prematurelyPocketedBody: Matter.Body,
    ): void {
        this.debugControl?.logEvent("GameWarning", {
            message:
                "Premature pocketing detected. Delegating round restart to MatchManager.",
            bodyId: prematurelyPocketedBody.id,
            round: this.matchManager.getCurrentRoundNumber(),
        });
        // We might not need to pass the body if the board reset handles cleanup
        this.matchManager.restartCurrentRound(prematurelyPocketedBody);
    }
}
