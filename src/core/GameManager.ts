/**
 * GameManager.ts
 *
 * This file contains the GameManager class, which centralizes game state information
 * such as player score, attempts, and provides methods for game events.
 */

import { Engine } from "./Engine";

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

  // Game Mode
  private gameMode: GameMode = null;
  private currentPlayer: 1 | 2 = 1; // Relevant for two-player mode

  // Player's score (number of objects collected) - Used for single player
  private score: number = 0;
  // Number of attempts (forces applied) - Used for single player
  private attempts: number = 0;

  // Scores and attempts for two-player mode
  private player1Score: number = 0;
  private player2Score: number = 0;
  private player1Attempts: number = 0;
  private player2Attempts: number = 0;

  // DOM elements for displaying game information
  private scoreElement: HTMLElement;
  private playerTurnElement: HTMLElement; // Added for two-player turn display

  // Game start modal elements
  private gameStartModal: HTMLElement;
  private onePlayerButton: HTMLElement;
  private twoPlayerButton: HTMLElement;

  // Game over modal elements
  private gameOverModal: HTMLElement;
  private finalScoreElement: HTMLElement;
  private restartButton: HTMLElement;

  // Reference to the engine
  private engine: Engine | null = null;

  // Initial number of non-static bodies
  private initialBodyCount: number = 0;

  // Flag to track if the game is over
  private isGameOver: boolean = false;

  // Callback for restarting the game
  private restartCallback: (() => void) | null = null;
  // Flag to track if the first user attempt has been made
  private firstAttemptMade: boolean = false;
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.initializeUIElements();
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
    console.log(`Initial body count set to: ${count}`);
  }

  /**
   * Initializes UI elements by getting references to the DOM elements
   */
  private initializeUIElements(): void {
    // Get references to game info elements
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
      console.error("Game info container not found!");
    }

    // Get references to game over modal elements
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
      this.startGame("single");
    });
    this.twoPlayerButton.addEventListener("click", () => {
      this.startGame("two");
    });

    this.gameOverModal = document.getElementById(
      "game-over-modal",
    ) as HTMLElement;
    this.finalScoreElement = document.getElementById(
      "final-score",
    ) as HTMLElement;
    this.restartButton = document.getElementById(
      "restart-button",
    ) as HTMLElement;

    // Add click event to restart button
    this.restartButton.addEventListener("click", () => {
      this.restartGame();
    });

    // Update displays with initial values
    // Update displays with initial values (will be reset on game start)
    this.updateScoreDisplay();

    // Show the game start modal
    this.showGameStartModal();
  }

  /**
   * Starts the game in the selected mode
   * @param mode - The game mode ('single' or 'two')
   */
  private startGame(mode: GameMode): void {
    if (!mode) return;
    this.gameMode = mode;
    this.resetGame(); // Reset stats for the new game
    this.hideGameStartModal();
    this.updateScoreDisplay(); // Show initial score display for the mode
    console.log(`Game started in ${mode} player mode.`);
    // Potentially trigger engine setup or other start actions if needed
    // For now, assume main.ts handles the engine runner start
  }

  /**
   * Updates the score display based on the current game mode
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
   * Shows the game over modal with final stats based on game mode
   */
  private showGameOverModal(): void {
    let finalMessage = "";
    if (this.gameMode === "single") {
      const percentage = this.attempts > 0
        ? Math.round((this.score / this.attempts) * 100)
        : 0;
      finalMessage =
        `Final Score: ${this.score}/${this.attempts} (${percentage}%)`;
    } else if (this.gameMode === "two") {
      const p1Percentage = this.player1Attempts > 0
        ? Math.round((this.player1Score / this.player1Attempts) * 100)
        : 0;
      const p2Percentage = this.player2Attempts > 0
        ? Math.round((this.player2Score / this.player2Attempts) * 100)
        : 0;
      finalMessage =
        `P1: ${this.player1Score}/${this.player1Attempts} (${p1Percentage}%)\nP2: ${this.player2Score}/${this.player2Attempts} (${p2Percentage}%)`;

      // Determine winner
      if (p1Percentage > p2Percentage) {
        finalMessage += "\nPlayer 1 Wins!";
      } else if (p2Percentage > p1Percentage) {
        finalMessage += "\nPlayer 2 Wins!";
      } else {
        // Tie-breaker: lower attempts wins. If attempts are equal, it's a draw.
        if (this.player1Attempts < this.player2Attempts) {
          finalMessage += "\nPlayer 1 Wins (fewer attempts)!";
        } else if (this.player2Attempts < this.player1Attempts) {
          finalMessage += "\nPlayer 2 Wins (fewer attempts)!";
        } else {
          finalMessage += "\nIt's a Draw!";
        }
      }
    }

    this.finalScoreElement.textContent = finalMessage;

    // Show the modal
    this.gameOverModal.style.opacity = "1";
    this.gameOverModal.style.pointerEvents = "auto";
  }

  /**
   * Hides the game over modal
   */
  private hideGameOverModal(): void {
    this.gameOverModal.style.opacity = "0";
    this.gameOverModal.style.pointerEvents = "none";
  }

  /**
   * Increments the score based on the current game mode and player
   *
   * @param points - Number of points to add (default: 1)
   */
  public addScore(points: number = 1): void {
    // Prevent scoring if game hasn't started or is over
    if (!this.gameMode || this.isGameOver) return;

    // Prevent scoring before the first attempt in any mode
    if (!this.firstAttemptMade) {
      console.log("Score added before first attempt. Restarting game.");
      this.restartGame(); // Or handle differently, maybe just ignore score?
      return;
    }

    if (this.gameMode === "single") {
      this.score += points;
      console.log(`Score increased! Current score: ${this.score}`);
    } else if (this.gameMode === "two") {
      if (this.currentPlayer === 1) {
        this.player1Score += points;
        console.log(
          `Player 1 score increased! Current score: ${this.player1Score}`,
        );
      } else {
        this.player2Score += points;
        console.log(
          `Player 2 score increased! Current score: ${this.player2Score}`,
        );
      }
    }

    this.updateScoreDisplay();
    this.checkGameOver(); // Check if adding score ended the game
  }

  /**
   * Increments the number of attempts and switches player in two-player mode
   *
   * @param count - Number of attempts to add (default: 1)
   */
  public addAttempt(count: number = 1): void {
    // Prevent attempts if game hasn't started or is over
    if (!this.gameMode || this.isGameOver) return;

    // Mark that the first attempt has been made, if not already
    if (!this.firstAttemptMade) {
      this.firstAttemptMade = true;
      console.log("First attempt registered.");
    }

    if (this.gameMode === "single") {
      this.attempts += count;
      console.log(`Attempt made! Total attempts: ${this.attempts}`);
    } else if (this.gameMode === "two") {
      if (this.currentPlayer === 1) {
        this.player1Attempts += count;
        console.log(
          `Player 1 attempt made! Total attempts: ${this.player1Attempts}`,
        );
      } else {
        this.player2Attempts += count;
        console.log(
          `Player 2 attempt made! Total attempts: ${this.player2Attempts}`,
        );
      }
      // Switch player turn
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      console.log(`Switched turn to Player ${this.currentPlayer}`);
    }

    this.updateScoreDisplay();
  }

  /**
   * Checks if the game is over (all non-static bodies collected)
   */
  public checkGameOver(): void {
    // If the game is already over or engine is not set, return
    if (this.isGameOver || !this.engine || !this.gameMode) { // Added check for gameMode
      return;
    }

    // Get all non-static bodies in the simulation
    const nonStaticBodies = this.engine
      .getAllBodies()
      .filter((body) => !body.isStatic);

    // If there are no non-static bodies left, the game is over
    // Ensure initialBodyCount was set and first attempt was made to prevent premature game over
    if (
      nonStaticBodies.length === 0 && this.initialBodyCount > 0 &&
      this.firstAttemptMade
    ) {
      this.isGameOver = true;
      console.log("Game over! All bodies collected.");

      // Show the game over modal
      this.showGameOverModal();
    }
  }

  /**
   * Restarts the game, showing the mode selection modal
   */
  private restartGame(): void {
    // Hide the game over modal
    this.hideGameOverModal();

    // Reset game state completely, including mode selection
    this.resetGame(true); // Pass true to indicate full restart

    // Call the engine restart callback if set
    if (this.restartCallback) {
      this.restartCallback();
    }

    // Show the game start modal again for mode selection
    this.showGameStartModal();
  }

  /**
   * Gets the current score (adapts based on mode, might need refinement)
   * For now, returns total score in two-player mode.
   * @returns The current score
   */
  public getScore(): number {
    if (this.gameMode === "two") {
      return this.player1Score + this.player2Score; // Or return based on current player?
    }
    return this.score;
  }

  /**
   * Gets the current number of attempts (adapts based on mode)
   * For now, returns total attempts in two-player mode.
   * @returns The current number of attempts
   */
  public getAttempts(): number {
    if (this.gameMode === "two") {
      return this.player1Attempts + this.player2Attempts;
    }
    return this.attempts;
  }

  /**
   * Resets the score to zero
   */
  public resetScore(): void {
    this.score = 0;
    this.player1Score = 0;
    this.player2Score = 0;
    // No need to update display here, resetGame handles it
  }

  /**
   * Resets the number of attempts to zero
   */
  public resetAttempts(): void {
    this.attempts = 0;
    this.player1Attempts = 0;
    this.player2Attempts = 0;
    // No need to update display here, resetGame handles it
  }

  /**
   * Resets all game statistics and state
   * @param fullRestart - If true, also resets gameMode for a complete restart.
   */
  public resetGame(fullRestart: boolean = false): void {
    this.resetScore();
    this.resetAttempts();
    this.isGameOver = false;
    this.firstAttemptMade = false; // Reset first attempt flag
    this.currentPlayer = 1; // Reset to player 1

    if (fullRestart) {
      this.gameMode = null; // Reset mode only on full restart
    }

    // Update display after resetting
    this.updateScoreDisplay();
    console.log("Game state reset.");
  }
}
