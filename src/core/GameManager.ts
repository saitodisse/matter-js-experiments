/**
 * GameManager.ts
 *
 * This file contains the GameManager class, which centralizes game state information
 * such as player score, attempts, and provides methods for game events.
 */

import { Engine } from "./Engine";
import { AudioManager } from "./AudioManager"; // Import AudioManager
import { DebugControl } from "../components/DebugControl"; // Added

// Define game modes
type GameMode = "single" | "two" | null;

/**
 * GameManager Class
 *
 * Centralizes game state and provides methods for tracking player actions,
 * score, and other game-related information.
 */
export class GameManager {
  // Singleton instance
  private static instance: GameManager;
  private audioManager: AudioManager; // Add AudioManager instance
  private debugControl?: DebugControl; // Added

  // Game Mode & State
  private gameMode: GameMode = null;
  private currentPlayer: 1 | 2 = 1; // Current player in two-player mode
  private lastPlayerToAttempt: 1 | 2 = 1; // Track who made the last attempt (for scoring)
  private isMatchOver: boolean = false; // Flag for Best of 7 match state

  // Round State (Score/Attempts within a single round)
  private score: number = 0; // Single player score per round
  private attempts: number = 0; // Single player attempts per round
  private player1Score: number = 0; // Player 1 score per round
  private player2Score: number = 0; // Player 2 score per round
  private player1Attempts: number = 0; // Player 1 attempts per round
  private player2Attempts: number = 0; // Player 2 attempts per round

  // Match State (Best of 7)
  private player1RoundsWon: number = 0;
  private player2RoundsWon: number = 0;
  private currentRoundNumber: number = 1;
  private startingPlayerThisRound: 1 | 2 = 1; // Tracks who starts the current round (2P)

  // DOM elements for displaying game information
  private roundScoreElement: HTMLElement; // Added for round scores
  private scoreElement: HTMLElement; // Displays attempts/score per round
  private playerTurnElement: HTMLElement; // Added for two-player turn display

  // Game start modal elements
  private gameStartModal: HTMLElement;
  private onePlayerButton: HTMLElement;
  private twoPlayerButton: HTMLElement;

  // Match over modal elements (Renamed from Game Over)
  private matchOverModal: HTMLElement;
  private finalMatchScoreElement: HTMLElement;
  private restartButton: HTMLElement; // Button now restarts the *match*

  // Reference to the engine
  private engine: Engine | null = null;

  // Initial number of non-static bodies
  private initialBodyCount: number = 0;

  // Flag to track if the *round* is over (implicitly handled by checking bodies)
  // isMatchOver flag handles the overall match state

  // Callback for restarting the game
  private restartCallback: (() => void) | null = null;
  // Flag to track if the first user attempt has been made
  private firstAttemptMade: boolean = false;
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.audioManager = new AudioManager(); // Instantiate AudioManager
    this.initializeUIElements();
    this.preloadSounds(); // Call preload method
  }

  /**
   * Gets the singleton instance of GameManager
   *
   * @returns The GameManager instance
   */
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Sets the engine reference
   *
   * @param engine - Reference to the physics engine
   */
  public setEngine(engine: Engine): void {
    this.engine = engine;
  }

  /**
   * Sets the callback function for restarting the game
   *
   * @param callback - Function to call when restarting the game
   */
  public setRestartCallback(callback: () => void): void {
    this.restartCallback = callback;
  }

  /**
   * Sets the initial count of non-static bodies
   *
   * @param count - Number of non-static bodies
   */
  public setInitialBodyCount(count: number): void {
    this.initialBodyCount = count;
    this.debugControl?.logEvent("GameState", {
      message: `Initial body count set to: ${count}`,
      round: this.currentRoundNumber, // Added round context
    });
  }

  /**
   * Initializes UI elements by getting references to the DOM elements
   */
  private initializeUIElements(): void {
    // Get references to game info elements
    this.roundScoreElement = document.getElementById(
      "round-score-display",
    ) as HTMLElement; // Added
    this.scoreElement = document.getElementById("score-display") as HTMLElement;
    // Create player turn element dynamically or assume it exists in HTML
    // For simplicity, let's assume it's part of score-display for now
    // or create it if needed. Let's modify scoreElement's parent.
    const infoContainer = document.getElementById("game-info-container");
    if (infoContainer) {
      this.playerTurnElement = document.createElement("div");
      this.playerTurnElement.id = "player-turn-display";
      this.playerTurnElement.style.display = "none"; // Hide initially
      infoContainer.appendChild(this.playerTurnElement);
    } else {
      // Fallback if container not found
      this.playerTurnElement = document.createElement("div"); // Dummy element
      // console.error("Game info container not found!"); // Keep as error or log?
      this.debugControl?.logEvent("UIWarning", {
        message: "Game info container not found!",
      });
    }

    // Get references to game start modal elements
    this.gameStartModal = document.getElementById(
      "game-start-modal",
    ) as HTMLElement;
    this.onePlayerButton = document.getElementById(
      "one-player-button",
    ) as HTMLElement;
    this.twoPlayerButton = document.getElementById(
      "two-player-button",
    ) as HTMLElement;

    // Add click event listeners
    this.onePlayerButton.addEventListener("click", () => {
      this.audioManager.playSound("plop_02", 0.7); // Play sound on button click
      this.startGame("single");
    });
    this.twoPlayerButton.addEventListener("click", () => {
      this.audioManager.playSound("plop_02", 0.7); // Play sound on button click
      this.startGame("two");
    });

    // Get references to match over modal elements (Renamed IDs)
    this.matchOverModal = document.getElementById(
      "match-over-modal", // Renamed ID
    ) as HTMLElement;
    this.finalMatchScoreElement = document.getElementById(
      "final-match-score", // Renamed ID
    ) as HTMLElement;
    this.restartButton = document.getElementById(
      "restart-button",
    ) as HTMLElement;

    // Add click event to restart button
    this.restartButton.addEventListener("click", () => {
      this.audioManager.playSound("pop", 0.7); // Play sound on button click
      this.resetGame("fullMatchRestart"); // Restart the whole match
    });

    // Update displays with initial values
    // Update displays with initial values (will be reset on game start)
    this.updateRoundScoreDisplay(); // Initialize round display
    this.updateScoreDisplay(); // Initialize attempt/score display

    // Show the game start modal
    this.showGameStartModal();
  }

  /**
   * Sets the DebugControl instance for logging.
   * @param debugControl - The DebugControl instance.
   */
  public setDebugControl(debugControl: DebugControl): void { // Added method
    this.debugControl = debugControl;
    // Also pass it to the AudioManager instance
    this.audioManager.setDebugControl(debugControl);
  }

  /**
   * Preloads necessary game sounds
   */
  private preloadSounds(): void {
    // Preload sounds
    this.audioManager.loadSound(
      "hit",
      "/sounds/hammer-hitting-a-head-100624.mp3",
    )
      .catch((error) => {
        const message =
          "Failed to preload /sounds/hammer-hitting-a-head-100624.mp3";
        console.error(message, error); // Keep console.error for critical failures
        this.debugControl?.logEvent("AudioError", { message, error });
      }); // Fixed parenthesis placement
    this.audioManager.loadSound(
      "hit_01",
      "/sounds/hit_01.ogg",
    )
      .catch((error) => {
        const message = "Failed to preload /sounds/hit_01.ogg";
        console.error(message, error); // Keep console.error
        this.debugControl?.logEvent("AudioError", { message, error });
      }); // Fixed parenthesis placement
    this.audioManager.loadSound(
      "plop_01",
      "/sounds/plop_01.ogg",
    )
      .catch((error) => {
        const message = "Failed to preload /sounds/plop_01.ogg";
        console.error(message, error); // Keep console.error
        this.debugControl?.logEvent("AudioError", { message, error });
      }); // Fixed parenthesis placement
    this.audioManager.loadSound(
      "plop_02",
      "/sounds/plop_02.ogg",
    )
      .catch((error) => {
        const message = "Failed to preload /sounds/plop_02.ogg";
        console.error(message, error); // Keep console.error
        this.debugControl?.logEvent("AudioError", { message, error });
      }); // Fixed parenthesis placement
    this.audioManager.loadSound(
      "pop",
      "/sounds/pop.ogg",
    )
      .catch((error) => {
        const message = "Failed to preload /sounds/pop.ogg";
        console.error(message, error); // Keep console.error
        this.debugControl?.logEvent("AudioError", { message, error });
      });
    this.audioManager.loadSound(
      "wooden_01",
      "/sounds/wooden_01.ogg",
    )
      .catch((error) => {
        const message = "Failed to preload /sounds/wooden_01.ogg";
        console.error(message, error); // Keep console.error
        this.debugControl?.logEvent("AudioError", { message, error });
      });
    this.audioManager.loadSound(
      "doorClose_4",
      "/sounds/doorClose_4.ogg",
    )
      .catch((error) => {
        const message = "Failed to preload /sounds/doorClose_4.ogg";
        console.error(message, error); // Keep console.error
        this.debugControl?.logEvent("AudioError", { message, error });
      }); // Fixed parenthesis placement
  }

  /**
   * Starts the game in the selected mode
   * @param mode - The game mode ('single' or 'two')
   */
  private startGame(mode: GameMode): void {
    if (!mode) return;
    this.gameMode = mode; // Set the game mode here
    this.resetGame("fullMatchRestart"); // Reset stats for the new match
    this.hideGameStartModal();
    // UI updates are handled within resetGame
    this.debugControl?.logEvent("GameState", { // Keep this general GameState log
      message: `Game started in ${mode} player mode.`,
    });
    // Potentially trigger engine setup or other start actions if needed
    // For now, assume main.ts handles the engine runner start
  }

  /**
   * Updates the round score display (Best of 7)
   */
  private updateRoundScoreDisplay(): void {
    if (this.gameMode === "single") {
      // Display something relevant for single player rounds if needed
      this.roundScoreElement.textContent =
        `Round: ${this.currentRoundNumber} | Won: ${this.player1RoundsWon}`;
    } else if (this.gameMode === "two") {
      this.roundScoreElement.textContent =
        `Round ${this.currentRoundNumber} | P1: ${this.player1RoundsWon} - P2: ${this.player2RoundsWon}`;
    } else {
      this.roundScoreElement.textContent = ""; // Hide before game start
    }
  }

  /**
   * Updates the current round's score/attempt display based on the current game mode
   */
  private updateScoreDisplay(): void {
    if (this.gameMode === "single") {
      this.scoreElement.textContent = `Score: ${this.score}/${this.attempts}`;
      this.playerTurnElement.style.display = "none";
    } else if (this.gameMode === "two") {
      this.scoreElement.textContent =
        `P1: ${this.player1Score}/${this.player1Attempts} | P2: ${this.player2Score}/${this.player2Attempts}`;
      this.playerTurnElement.textContent = `Turn: Player ${this.currentPlayer}`;
      this.playerTurnElement.style.display = "block";
    } else {
      // Initial state before mode selection
      this.scoreElement.textContent = "Score: 0/0";
      this.playerTurnElement.style.display = "none";
    }
  }

  /**
   * Shows the game start modal with options for number of players
   */
  private showGameStartModal(): void {
    // Show the modal
    this.gameStartModal.style.opacity = "1";
    this.gameStartModal.style.pointerEvents = "auto";
  }

  /**
   * Hides the game start modal
   */
  private hideGameStartModal(): void {
    this.gameStartModal.style.opacity = "0";
    this.gameStartModal.style.pointerEvents = "none";
  }

  /**
   * Shows the match over modal with final match stats
   */
  private showMatchOverModal(): void {
    let finalMessage = "";
    if (this.gameMode === "single") {
      // Adjust message for single player match context if needed
      finalMessage = `Match Complete! Rounds Won: ${this.player1RoundsWon}`;
    } else if (this.gameMode === "two") {
      const winner = this.player1RoundsWon > this.player2RoundsWon
        ? "Player 1"
        : "Player 2";
      finalMessage =
        `${winner} Wins the Match!\nFinal Score: ${this.player1RoundsWon} - ${this.player2RoundsWon}`;
    }

    this.finalMatchScoreElement.textContent = finalMessage;

    // Show the modal
    this.matchOverModal.style.opacity = "1";
    this.matchOverModal.style.pointerEvents = "auto";
  }

  /**
   * Hides the match over modal
   */
  private hideMatchOverModal(): void {
    this.matchOverModal.style.opacity = "0";
    this.matchOverModal.style.pointerEvents = "none";
  }

  /**
   * Increments the score based on the current game mode and the player who made the last attempt
   *
   * @param points - Number of points to add (default: 1)
   */
  public addScore(points: number = 1): void {
    // Prevent scoring if game hasn't started or match is over
    if (!this.gameMode || this.isMatchOver) return;

    // Prevent scoring before the first attempt in any mode
    if (!this.firstAttemptMade) {
      this.debugControl?.logEvent("GameWarning", {
        message: "Score added before first attempt. Restarting game.",
      });
      this.resetGame("fullMatchRestart"); // Should not happen ideally, restart match
      return;
    }

    if (this.gameMode === "single") {
      this.score += points;
      this.debugControl?.logEvent("PlayerAction", {
        action: "score",
        mode: "single",
        value: this.score,
        round: this.currentRoundNumber, // Added round context
      });
    } else if (this.gameMode === "two") {
      // Score is awarded to the player who made the last attempt
      if (this.lastPlayerToAttempt === 1) {
        this.player1Score += points;
        this.debugControl?.logEvent("PlayerAction", {
          action: "score",
          mode: "two",
          player: 1,
          value: this.player1Score,
          round: this.currentRoundNumber, // Added round context
        });
      } else {
        this.player2Score += points;
        this.debugControl?.logEvent("PlayerAction", {
          action: "score",
          mode: "two",
          player: 2,
          value: this.player2Score,
          round: this.currentRoundNumber, // Added round context
        });
      }
    }

    this.updateScoreDisplay();
    this.audioManager.playSound("plop_02", 0.8); // Play sound on score
    this.checkRoundOver(); // Check if adding score ended the round/match
  }

  /**
   * Increments the number of attempts, stores the attempting player, and switches player in two-player mode
   *
   * @param count - Number of attempts to add (default: 1)
   */
  public addAttempt(count: number = 1): void {
    // Prevent attempts if game hasn't started or match is over
    if (!this.gameMode || this.isMatchOver) return;

    // Mark that the first attempt has been made, if not already
    if (!this.firstAttemptMade) {
      this.firstAttemptMade = true;
      // Added log for first attempt
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
        round: this.currentRoundNumber, // Added round context
      });
      // In single player, the 'last player' is always player 1 conceptually
      this.lastPlayerToAttempt = 1;
    } else if (this.gameMode === "two") {
      // Store the player making the attempt *before* switching turns
      this.lastPlayerToAttempt = this.currentPlayer;

      if (this.currentPlayer === 1) {
        this.player1Attempts += count;
        this.debugControl?.logEvent("PlayerAction", {
          action: "attempt",
          mode: "two",
          player: 1,
          value: this.player1Attempts,
          round: this.currentRoundNumber, // Added round context
        });
      } else {
        this.player2Attempts += count;
        this.debugControl?.logEvent("PlayerAction", {
          action: "attempt",
          mode: "two",
          player: 2,
          value: this.player2Attempts,
          round: this.currentRoundNumber, // Added round context
        });
      }
      // Switch player turn
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      this.debugControl?.logEvent("GameState", { // Keep this general GameState log
        message: `Switched turn to Player ${this.currentPlayer}`,
        round: this.currentRoundNumber, // Added round context
      });
    }

    this.updateScoreDisplay();
  }

  /**
   * Checks if the current round is over (all non-static bodies collected).
   * If so, awards the round, checks for match completion, and proceeds.
   */
  public checkRoundOver(): void {
    // Added log at the start of the function
    this.debugControl?.logEvent("RoundCheck", {
      message: "Checking if round is over...",
      round: this.currentRoundNumber,
    });
    // If the match is already over, engine not set, or game mode not set, return
    if (this.isMatchOver || !this.engine || !this.gameMode) {
      // Added more detailed log for skipping
      this.debugControl?.logEvent("RoundCheckSkipped", {
        message: "Round check skipped.",
        round: this.currentRoundNumber,
        isMatchOver: this.isMatchOver,
        engineExists: !!this.engine,
        gameModeSet: !!this.gameMode,
      });
      return;
    }

    // Get all non-static bodies in the simulation
    const nonStaticBodies = this.engine
      .getAllBodies()
      .filter((body) => !body.isStatic);

    // --- Debugging Round Over Condition ---
    this.debugControl?.logEvent("CheckRoundOverValues", { // Changed event name for clarity
      nonStaticBodiesCount: nonStaticBodies.length,
      initialBodyCount: this.initialBodyCount,
      firstAttemptMade: this.firstAttemptMade,
      conditionMet: nonStaticBodies.length === 0 && this.initialBodyCount > 0 &&
        this.firstAttemptMade,
      round: this.currentRoundNumber, // Added round context
    });
    // --- End Debugging ---

    // Check if the round is over (no non-static bodies left)
    // Ensure initialBodyCount was set and first attempt was made to prevent premature round end
    if (
      nonStaticBodies.length === 0 && this.initialBodyCount > 0 &&
      this.firstAttemptMade
    ) {
      this.debugControl?.logEvent("RoundState", { // Changed event type
        // Clarified log message
        message:
          `Round ${this.currentRoundNumber} clear condition met! All bodies collected.`,
        round: this.currentRoundNumber,
      });

      // Determine round winner and update match score
      if (this.gameMode === "single") {
        this.player1RoundsWon++;
        // Added current round scores to log
        this.debugControl?.logEvent("RoundWin", {
          round: this.currentRoundNumber,
          winner: "Player 1 (Single Player)",
          scoreP1: this.player1RoundsWon,
          scoreP2: this.player2RoundsWon,
        });
      } else { // Two-player mode
        if (this.lastPlayerToAttempt === 1) {
          this.player1RoundsWon++;
          // Added current round scores to log
          this.debugControl?.logEvent("RoundWin", {
            round: this.currentRoundNumber,
            winner: 1,
            scoreP1: this.player1RoundsWon,
            scoreP2: this.player2RoundsWon,
          });
        } else {
          this.player2RoundsWon++;
          // Added current round scores to log
          this.debugControl?.logEvent("RoundWin", {
            round: this.currentRoundNumber,
            winner: 2,
            scoreP1: this.player1RoundsWon,
            scoreP2: this.player2RoundsWon,
          });
        }
      }

      // Update the round score display
      this.updateRoundScoreDisplay();
      this.audioManager.playSound("doorClose_4", 1.0); // Play sound on round over

      // Check if the match is over
      if (this.checkMatchOver()) {
        this.isMatchOver = true;
        // Changed score keys for clarity
        this.debugControl?.logEvent("MatchState", {
          message: "Match over condition met.",
          finalScoreP1: this.player1RoundsWon,
          finalScoreP2: this.player2RoundsWon,
        });
        this.showMatchOverModal();
      } else {
        // Match not over, set up the next round
        // Log the *next* round number for clarity
        this.debugControl?.logEvent("RoundState", {
          message: "Proceeding to next round setup.",
          nextRound: this.currentRoundNumber + 1,
        });
        this.resetGame("nextRoundSetup");
      }
    }
  }

  /**
   * Checks if the match is over (Best of 7 condition met).
   * @returns True if the match is over, false otherwise.
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
   * Gets the current score for the round (adapts based on mode)
   * @returns The current score for the round
   */
  public getScore(): number {
    if (this.gameMode === "two") {
      return this.player1Score + this.player2Score; // Or return based on current player?
    }
    return this.score;
  }

  /**
   * Gets the current number of attempts for the round (adapts based on mode)
   * @returns The current number of attempts for the round
   */
  public getAttempts(): number {
    if (this.gameMode === "two") {
      return this.player1Attempts + this.player2Attempts;
    }
    return this.attempts;
  }

  /**
   * Resets the score for the current round to zero
   */
  public resetScore(): void {
    this.score = 0;
    this.player1Score = 0;
    this.player2Score = 0;
    // No need to update display here, resetGame handles it
  }

  /**
   * Resets the number of attempts for the current round to zero
   */
  public resetAttempts(): void {
    this.attempts = 0;
    this.player1Attempts = 0;
    this.player2Attempts = 0;
    // No need to update display here, resetGame handles it
  }

  /**
   * Resets the game state for either a new match or the next round.
   * @param resetType - 'fullMatchRestart' or 'nextRoundSetup'
   */
  public resetGame(resetType: "fullMatchRestart" | "nextRoundSetup"): void {
    // Added log at the start of the function
    this.debugControl?.logEvent("GameReset", { type: resetType });

    // --- Reset Round State (Common to both reset types) ---
    this.score = 0;
    this.player1Score = 0;
    this.player2Score = 0;
    this.attempts = 0;
    this.player1Attempts = 0;
    this.player2Attempts = 0;
    this.firstAttemptMade = false;
    this.lastPlayerToAttempt = 1; // Reset last attempter for the round

    // --- Reset based on type ---
    if (resetType === "fullMatchRestart") {
      this.hideMatchOverModal(); // Hide if visible
      // REMOVED: this.gameMode = null; // Do NOT reset game mode on match restart
      this.player1RoundsWon = 0;
      this.player2RoundsWon = 0;
      this.currentRoundNumber = 1;
      this.startingPlayerThisRound = 1; // Player 1 always starts the match
      this.currentPlayer = 1;
      this.isMatchOver = false;
      // Don't show start modal here unless gameMode was initially null
      if (!this.gameMode) {
        this.showGameStartModal();
      } else {
        // If mode already selected, directly start the first round setup
        if (this.restartCallback) {
          this.restartCallback();
        } else {
          this.debugControl?.logEvent("GameWarning", {
            context: "resetGame(fullMatchRestart)",
            message: "Restart callback not set.",
          });
        }
      }
    } else { // nextRoundSetup
      this.currentRoundNumber++;
      // Alternate starting player for the new round
      this.startingPlayerThisRound = this.startingPlayerThisRound === 1 ? 2 : 1;
      this.currentPlayer = this.startingPlayerThisRound;
      // Changed event type and added startingPlayer info
      this.debugControl?.logEvent("RoundState", {
        message:
          `Player ${this.currentPlayer} starts Round ${this.currentRoundNumber}.`,
        startingPlayer: this.startingPlayerThisRound,
      });

      // Call the engine restart callback to clear board and add shapes for the new round
      if (this.restartCallback) {
        this.restartCallback();
      } else {
        // Added context to warning message
        this.debugControl?.logEvent("GameWarning", {
          context: "resetGame(nextRoundSetup)",
          message: "Restart callback not set in GameManager.",
        });
      }
    }

    // --- Update UI (Common) ---
    this.updateRoundScoreDisplay();
    this.updateScoreDisplay();
  }

  /**
   * Gets the AudioManager instance.
   * @returns The AudioManager instance.
   */
  public getAudioManager(): AudioManager { // Added method
    return this.audioManager;
  }
}
