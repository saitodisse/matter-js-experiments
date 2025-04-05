/**
 * GameManager.ts
 *
 * This file contains the GameManager class, which centralizes game state information
 * such as player score, attempts, and provides methods for game events.
 */

import { Engine } from "./Engine";
import { AudioManager } from "./AudioManager"; // Import AudioManager
import { DebugControl } from "../components/DebugControl"; // Added
import Matter from "matter-js"; // Import Matter

// Define game modes
type GameMode = "single" | "two" | null;

// Define structure for round history
interface RoundResult {
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
interface RankingEntry1P {
  name: string;
  score: number; // Total match score (sum of round accuracy scores, max 400)
}
// New interface for 2P individual ranking
interface RankingEntry2PIndividual {
  name: string;
  score: number; // Total match score (sum of round accuracy scores)
}

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

  // Constants
  private readonly RANKING_MAX_ENTRIES = 3; // Changed to Top 3
  private readonly LOCALSTORAGE_KEY_1P = "ranking1P";
  private readonly LOCALSTORAGE_KEY_2P_INDIVIDUAL = "ranking2PIndividual"; // New key for individual 2P ranking

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
  private roundHistory: RoundResult[] = []; // Added: To store results of each round
  private totalMatchScore1P: number = 0; // Total accuracy-based score in 1P match for ranking
  private totalMatchScoreP1_2P: number = 0; // Total accuracy-based score for P1 in 2P match
  private totalMatchScoreP2_2P: number = 0; // Total accuracy-based score for P2 in 2P match

  // DOM elements for displaying game information
  private roundScoreElement: HTMLElement; // Added for round scores
  private scoreElement: HTMLElement; // Displays attempts/score per round
  private playerTurnElement: HTMLElement; // Added for two-player turn display
  private matchScoreElement: HTMLElement | null = null; // Added for current match score display

  // Game start modal elements
  private gameStartModal: HTMLElement;
  private onePlayerButton: HTMLElement;
  private twoPlayerButton: HTMLElement;

  // Match over modal elements (Renamed from Game Over)
  private matchOverModal: HTMLElement;
  private finalMatchScoreElement: HTMLElement;
  private restartButton: HTMLElement; // Button now restarts the *match*
  // Added refs for new modal elements (will be assigned in initializeUIElements)
  private roundSummaryElement: HTMLElement | null = null;
  private playerNameInputContainer: HTMLElement | null = null; // Container for name inputs
  private playerNameInput1: HTMLInputElement | null = null;
  private playerNameInput2: HTMLInputElement | null = null;
  private saveScoreButton: HTMLElement | null = null;
  private rankingDisplayElement: HTMLElement | null = null;

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
    this.matchScoreElement = document.getElementById("match-score-display"); // Added

    // Create player turn element dynamically or assume it exists in HTML
    const infoContainer = document.getElementById("game-info-container");
    if (infoContainer) {
      this.playerTurnElement = document.createElement("div");
      this.playerTurnElement.id = "player-turn-display";
      this.playerTurnElement.style.display = "none"; // Hide initially
      infoContainer.appendChild(this.playerTurnElement);
    } else {
      this.playerTurnElement = document.createElement("div"); // Dummy element
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

    // Add click event listeners for game start
    this.onePlayerButton.addEventListener("click", () => {
      this.audioManager.playSound("plop_02", 0.7);
      this.startGame("single");
    });
    this.twoPlayerButton.addEventListener("click", () => {
      this.audioManager.playSound("plop_02", 0.7);
      this.startGame("two");
    });

    // Get references to match over modal elements
    this.matchOverModal = document.getElementById(
      "match-over-modal",
    ) as HTMLElement;
    this.finalMatchScoreElement = document.getElementById(
      "final-match-score",
    ) as HTMLElement;
    this.restartButton = document.getElementById(
      "restart-button",
    ) as HTMLElement;
    // Get refs for new elements inside match over modal
    this.roundSummaryElement = document.getElementById("round-summary");
    this.playerNameInputContainer = document.getElementById(
      "player-name-input-container",
    );
    this.playerNameInput1 = document.getElementById("player-name-input-1") as
      | HTMLInputElement
      | null;
    this.playerNameInput2 = document.getElementById("player-name-input-2") as
      | HTMLInputElement
      | null;
    this.saveScoreButton = document.getElementById("save-score-button");
    this.rankingDisplayElement = document.getElementById("ranking-display");

    // Add click event to restart button
    this.restartButton.addEventListener("click", () => {
      this.audioManager.playSound("pop", 0.7);
      this.resetGame("fullMatchRestart"); // Restart the whole match
    });

    // Add click event to save score button
    if (this.saveScoreButton) {
      this.saveScoreButton.addEventListener("click", () => {
        this.handleSaveScore();
      });
    } else {
      this.debugControl?.logEvent("UIWarning", {
        message: "Save score button not found!",
      });
    }

    // Update displays with initial values
    this.updateRoundScoreDisplay();
    this.updateScoreDisplay();
    this.updateMatchScoreDisplay(); // Added

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
      this.roundScoreElement.textContent = `Round ${this.currentRoundNumber}`; // Simplified for 2P, match score shown separately
    } else {
      this.roundScoreElement.textContent = ""; // Hide before game start
    }
  }

  /**
   * Updates the current match score display (rounds won)
   */
  private updateMatchScoreDisplay(): void {
    if (!this.matchScoreElement) return;

    if (this.gameMode === "single") {
      // Hide or show something else for single player? For now, hide.
      this.matchScoreElement.style.display = "none";
    } else if (this.gameMode === "two") {
      this.matchScoreElement.textContent =
        `Match: P1 ${this.player1RoundsWon} - P2 ${this.player2RoundsWon}`;
      this.matchScoreElement.style.display = "block";
    } else {
      this.matchScoreElement.style.display = "none";
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
   * Shows the match over modal with final match stats, summary, ranking, and save options.
   */
  private showMatchOverModal(): void {
    let finalMessage = "";
    let showSaveOption = false;

    // Ensure the last round's result is recorded before showing the modal
    // This handles cases where the match ends on the very last round
    if (this.roundHistory.length < this.currentRoundNumber && this.gameMode) {
      this.recordRoundResult();
    }

    if (this.gameMode === "single") {
      // Use the new total score calculation for the message
      finalMessage = `Match Complete! Final Score: ${this.totalMatchScore1P}`;
      showSaveOption = true; // Allow saving 1P scores
    } else if (this.gameMode === "two") {
      const winner = this.player1RoundsWon > this.player2RoundsWon
        ? "Player 1"
        : "Player 2";
      finalMessage =
        `${winner} Wins the Match!\nFinal Score: ${this.player1RoundsWon} - ${this.player2RoundsWon}`;
      showSaveOption = true; // Allow saving 2P results (individual scores)
    }

    this.finalMatchScoreElement.textContent = finalMessage;

    // Display Round Summary
    if (this.roundSummaryElement) {
      this.roundSummaryElement.innerHTML = this.displayRoundSummary(
        this.roundHistory,
      );
      this.roundSummaryElement.style.display = "block";
    }

    // Display Ranking
    if (this.rankingDisplayElement) {
      // For 2P mode, now display the individual accuracy ranking
      const rankingData = this.gameMode === "single"
        ? this.getRanking1P()
        : this.getRanking2PIndividual();
      this.rankingDisplayElement.innerHTML = this.displayRanking(
        rankingData,
        this.gameMode === "two",
      );
      this.rankingDisplayElement.style.display = "block";
    }

    // Show/Hide Name Inputs and Save Button
    if (this.playerNameInputContainer) {
      this.playerNameInputContainer.style.display = showSaveOption
        ? "block"
        : "none";
    }
    if (this.playerNameInput1) {
      this.playerNameInput1.style.display = showSaveOption
        ? "inline-block"
        : "none";
      this.playerNameInput1.value = ""; // Clear previous input
    }
    if (this.playerNameInput2) {
      this.playerNameInput2.style.display =
        (showSaveOption && this.gameMode === "two") ? "inline-block" : "none";
      this.playerNameInput2.value = ""; // Clear previous input
    }
    if (this.saveScoreButton) {
      this.saveScoreButton.style.display = showSaveOption
        ? "inline-block"
        : "none";
    }

    // Show the modal
    this.matchOverModal.style.opacity = "1";
    this.matchOverModal.style.pointerEvents = "auto";
  }

  /**
   * Hides the match over modal and related UI elements.
   */
  private hideMatchOverModal(): void {
    this.matchOverModal.style.opacity = "0";
    this.matchOverModal.style.pointerEvents = "none";

    // Hide summary, ranking, and save elements when modal closes
    if (this.roundSummaryElement) {
      this.roundSummaryElement.style.display = "none";
    }
    if (this.rankingDisplayElement) {
      this.rankingDisplayElement.style.display = "none";
    }
    if (this.playerNameInputContainer) {
      this.playerNameInputContainer.style.display = "none";
    }
    if (this.saveScoreButton) this.saveScoreButton.style.display = "none";
  }

  /**
   * Increments the score (shapes pocketed), updates displays, and checks for round/match end.
   *
   * @param points - Number of points to add (default: 1)
   */
  public addScore(points: number = 1): void {
    // Prevent scoring if game hasn't started or match is over
    if (!this.gameMode || this.isMatchOver || !this.engine) return;

    // Prevent scoring before the first attempt in any mode
    if (!this.firstAttemptMade) {
      this.debugControl?.logEvent("GameWarning", {
        message: "Score added before first attempt. Restarting current round.", // Updated message
      });
      this.resetGame("currentRoundRestart"); // Restart only the current round
      return;
    }

    // --- Update Round Score ---
    const scoringPlayer = this.lastPlayerToAttempt; // Player who made the attempt leading to this score
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
    this.updateScoreDisplay();
    this.audioManager.playSound("plop_02", 0.8); // Play sound on score

    // --- Check for Round/Match End ---
    // Get current non-static bodies *after* potential removal in BoundaryBox's setTimeout
    // Need a slight delay to ensure the count is accurate after removal.
    setTimeout(() => {
      if (!this.engine || this.isMatchOver) return; // Re-check state in case match ended quickly

      const nonStaticBodies = Matter.Composite.allBodies(this.engine.getWorld())
        .filter((body) => !body.isStatic);
      const bodiesRemaining = nonStaticBodies.length;

      this.debugControl?.logEvent("CheckRoundOverValues", {
        nonStaticBodiesCount: bodiesRemaining,
        initialBodyCount: this.initialBodyCount,
        firstAttemptMade: this.firstAttemptMade,
        conditionMet: bodiesRemaining === 0 && this.initialBodyCount > 0 &&
          this.firstAttemptMade,
        round: this.currentRoundNumber,
      });

      if (
        bodiesRemaining === 0 && this.initialBodyCount > 0 &&
        this.firstAttemptMade
      ) {
        this.debugControl?.logEvent("RoundState", {
          message:
            `Round ${this.currentRoundNumber} clear condition met! All bodies collected.`,
          round: this.currentRoundNumber,
        });

        // Record result *before* potentially incrementing round number
        this.recordRoundResult();

        // Determine round winner based on the player who scored the last point
        if (this.gameMode === "single") {
          this.player1RoundsWon++;
          this.debugControl?.logEvent("RoundWin", {
            round: this.currentRoundNumber,
            winner: "Player 1 (Single Player)",
            scoreP1: this.player1RoundsWon,
            scoreP2: this.player2RoundsWon,
          });
        } else { // Two-player mode
          if (scoringPlayer === 1) { // Use the player who scored the last point
            this.player1RoundsWon++;
            this.debugControl?.logEvent("RoundWin", {
              round: this.currentRoundNumber,
              winner: 1,
              scoreP1: this.player1RoundsWon,
              scoreP2: this.player2RoundsWon,
            });
          } else {
            this.player2RoundsWon++;
            this.debugControl?.logEvent("RoundWin", {
              round: this.currentRoundNumber,
              winner: 2,
              scoreP1: this.player1RoundsWon,
              scoreP2: this.player2RoundsWon,
            });
          }
        }

        // Update displays
        this.updateRoundScoreDisplay();
        this.updateMatchScoreDisplay(); // Update match score display
        this.audioManager.playSound("doorClose_4", 1.0); // Play sound on round over

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
          this.debugControl?.logEvent("RoundState", {
            message: "Proceeding to next round setup.",
            nextRound: this.currentRoundNumber + 1,
          });
          this.resetGame("nextRoundSetup");
        }
      }
    }, 50); // Small delay to allow physics engine/removal to potentially complete
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
   * Simplified checkRoundOver - actual logic moved to addScore.
   * Kept for potential future use or if called elsewhere unexpectedly.
   */
  public checkRoundOver(): void {
    this.debugControl?.logEvent("RoundCheckDeprecated", {
      message: "checkRoundOver called (logic now primarily in addScore)",
      round: this.currentRoundNumber,
    });
    // Original logic is now primarily within addScore's setTimeout callback
  }

  /**
   * Records the result of the completed round. Calculates accuracy-based scores.
   */
  private recordRoundResult(): void {
    if (!this.gameMode) return; // Should not happen if called correctly

    let roundData: RoundResult;
    if (this.gameMode === "single") {
      // Calculate accuracy-based score for the round (0-100)
      const accuracy = this.attempts > 0 ? (this.score / this.attempts) : 0;
      const roundScore = Math.min(100, Math.round(accuracy * 100));

      roundData = {
        round: this.currentRoundNumber,
        scoreP1: this.score, // Actual shapes pocketed
        attemptsP1: this.attempts,
        roundScore1P: roundScore, // Calculated score (0-100)
      };
      this.totalMatchScore1P += roundScore; // Accumulate accuracy-based score for 1P ranking
      this.debugControl?.logEvent("RoundRecord", {
        mode: "single",
        round: this.currentRoundNumber,
        score: this.score,
        attempts: this.attempts,
        roundScore: roundScore, // Log calculated round score
        totalMatchScore: this.totalMatchScore1P,
      });
    } else { // 'two'
      // Calculate accuracy-based scores for each player
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
        roundScoreP1_2P: roundScoreP1, // Store calculated score
        roundScoreP2_2P: roundScoreP2, // Store calculated score
      };
      this.totalMatchScoreP1_2P += roundScoreP1; // Accumulate P1 score
      this.totalMatchScoreP2_2P += roundScoreP2; // Accumulate P2 score

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
   * @param resetType - 'fullMatchRestart', 'nextRoundSetup', or 'currentRoundRestart'
   */
  public resetGame(
    resetType: "fullMatchRestart" | "nextRoundSetup" | "currentRoundRestart",
  ): void {
    // Added log at the start of the function
    this.debugControl?.logEvent("GameReset", { type: resetType });

    // Record previous round result BEFORE resetting state if setting up next round
    // Moved this logic inside addScore's check to ensure it happens correctly

    // --- Reset Round State (Common to 'nextRoundSetup' and 'currentRoundRestart') ---
    if (resetType === "nextRoundSetup" || resetType === "currentRoundRestart") {
      this.score = 0;
      this.player1Score = 0;
      this.player2Score = 0;
      this.attempts = 0;
      this.player1Attempts = 0;
      this.player2Attempts = 0;
      this.firstAttemptMade = false;
      this.lastPlayerToAttempt = 1; // Reset last attempter for the round
    }

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
      this.roundHistory = []; // Clear history for new match
      this.totalMatchScore1P = 0; // Clear total score for new match
      this.totalMatchScoreP1_2P = 0; // Clear total 2P scores
      this.totalMatchScoreP2_2P = 0;

      // Reset round state as well for a full restart
      this.resetScore();
      this.resetAttempts();
      this.firstAttemptMade = false;
      this.lastPlayerToAttempt = 1;

      // Don't show start modal here unless gameMode was initially null
      if (!this.gameMode) {
        this.showGameStartModal();
      } else {
        // If mode already selected, directly start the first round setup
        if (this.restartCallback) {
          this.restartCallback(); // Reset board for round 1
        } else {
          this.debugControl?.logEvent("GameWarning", {
            context: "resetGame(fullMatchRestart)",
            message: "Restart callback not set.",
          });
        }
      }
    } else if (resetType === "nextRoundSetup") {
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
    } else if (resetType === "currentRoundRestart") {
      // Reset current player to who started this round
      this.currentPlayer = this.startingPlayerThisRound;
      this.debugControl?.logEvent("RoundState", {
        message:
          `Restarting current round (${this.currentRoundNumber}). Player ${this.currentPlayer} starts.`,
      });
      // Call the engine restart callback to clear board and add shapes
      if (this.restartCallback) {
        this.restartCallback();
      } else {
        this.debugControl?.logEvent("GameWarning", {
          context: "resetGame(currentRoundRestart)",
          message: "Restart callback not set.",
        });
      }
      // Note: Does NOT increment currentRoundNumber or change roundsWon/total scores
    }

    // --- Update UI (Common) ---
    this.updateRoundScoreDisplay();
    this.updateScoreDisplay();
    this.updateMatchScoreDisplay(); // Added call
  }

  // --- LocalStorage Ranking Helpers ---

  private getRanking1P(): RankingEntry1P[] {
    const stored = localStorage.getItem(this.LOCALSTORAGE_KEY_1P);
    try {
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.debugControl?.logEvent("LocalStorageError", {
        message: "Failed to parse 1P ranking",
        error: e,
      });
      return [];
    }
  }

  private saveRanking1P(name: string, score: number): void {
    if (!name || score < 0) { // Allow score 0, but not negative
      this.debugControl?.logEvent("RankingSaveSkipped", {
        reason: "Invalid name or score",
        name,
        score,
      });
      return;
    }
    const rankings = this.getRanking1P();
    const newEntry: RankingEntry1P = { name: name.substring(0, 15), score }; // Limit name length

    // Check if score qualifies for Top 3
    if (
      rankings.length < this.RANKING_MAX_ENTRIES ||
      score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
    ) {
      rankings.push(newEntry);
      // Sort by score descending
      rankings.sort((a, b) => b.score - a.score);
      // Keep only top entries
      const updatedRankings = rankings.slice(0, this.RANKING_MAX_ENTRIES);
      try {
        localStorage.setItem(
          this.LOCALSTORAGE_KEY_1P,
          JSON.stringify(updatedRankings),
        );
        this.debugControl?.logEvent("RankingSaved", {
          mode: "1P",
          entry: newEntry,
        });
      } catch (e) {
        this.debugControl?.logEvent("LocalStorageError", {
          message: "Failed to save 1P ranking",
          error: e,
        });
      }
    } else {
      this.debugControl?.logEvent("RankingSaveSkipped", {
        reason: "Score not high enough for Top 3",
        name,
        score,
        rankings,
      });
    }
  }

  // Renamed and updated for individual 2P scores
  private getRanking2PIndividual(): RankingEntry2PIndividual[] {
    const stored = localStorage.getItem(this.LOCALSTORAGE_KEY_2P_INDIVIDUAL);
    try {
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.debugControl?.logEvent("LocalStorageError", {
        message: "Failed to parse 2P individual ranking",
        error: e,
      });
      return [];
    }
  }

  // Renamed and updated for individual 2P scores
  private saveRanking2PIndividual(name: string, score: number): void {
    if (!name || score < 0) {
      this.debugControl?.logEvent("RankingSaveSkipped", {
        reason: "Invalid name or score for 2P individual",
        name,
        score,
      });
      return;
    }
    const rankings = this.getRanking2PIndividual();
    const newEntry: RankingEntry2PIndividual = {
      name: name.substring(0, 15),
      score,
    };

    // Check if score qualifies for Top 3
    if (
      rankings.length < this.RANKING_MAX_ENTRIES ||
      score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
    ) {
      rankings.push(newEntry);
      // Sort by score descending
      rankings.sort((a, b) => b.score - a.score);
      // Keep only top entries
      const updatedRankings = rankings.slice(0, this.RANKING_MAX_ENTRIES);
      try {
        localStorage.setItem(
          this.LOCALSTORAGE_KEY_2P_INDIVIDUAL,
          JSON.stringify(updatedRankings),
        );
        this.debugControl?.logEvent("RankingSaved", {
          mode: "2P Individual",
          entry: newEntry,
        });
      } catch (e) {
        this.debugControl?.logEvent("LocalStorageError", {
          message: "Failed to save 2P individual ranking",
          error: e,
        });
      }
    } else {
      this.debugControl?.logEvent("RankingSaveSkipped", {
        reason: "Score not high enough for 2P Top 3",
        name,
        score,
        rankings,
      });
    }
  }

  // --- End LocalStorage ---

  // --- UI Helpers ---

  private displayRoundSummary(history: RoundResult[]): string {
    if (!history || history.length === 0) return "<p>No rounds played yet.</p>";

    let summaryHtml = "<h4>Round Summary</h4><ul>";
    history.forEach((result) => {
      if (this.gameMode === "single") {
        // Display calculated round score (0-100) along with raw score/attempts
        summaryHtml +=
          `<li>Round ${result.round}: ${result.scoreP1}/${result.attemptsP1} (Score: ${
            result.roundScore1P ?? "N/A"
          })</li>`;
      } else {
        // Display calculated round scores for 2P
        summaryHtml +=
          `<li>Round ${result.round}: P1 ${result.scoreP1}/${result.attemptsP1} (Score: ${
            result.roundScoreP1_2P ?? "N/A"
          }) | P2 ${result.scoreP2 ?? 0}/${result.attemptsP2 ?? 0} (Score: ${
            result.roundScoreP2_2P ?? "N/A"
          })</li>`;
      }
    });
    summaryHtml += "</ul>";
    return summaryHtml;
  }

  private displayRanking(rankingData: any[], is2P: boolean): string {
    // Updated title for 2P individual ranking
    let rankingHtml = `<h4>Ranking (${
      is2P ? "2 Player - Top Scores" : "1 Player - Top Scores"
    })</h4>`;
    if (!rankingData || rankingData.length === 0) {
      rankingHtml += "<p>No rankings yet.</p>";
      return rankingHtml;
    }

    rankingHtml += "<ol>";
    rankingData.forEach((entry) => {
      if (is2P) {
        // Display individual 2P ranking entry
        const entry2P = entry as RankingEntry2PIndividual;
        rankingHtml += `<li>${entry2P.name}: ${entry2P.score}</li>`;
      } else {
        const entry1P = entry as RankingEntry1P;
        rankingHtml += `<li>${entry1P.name}: ${entry1P.score}</li>`;
      }
    });
    rankingHtml += "</ol>";
    return rankingHtml;
  }

  // --- End UI Helpers ---

  // Handles saving the score based on game mode
  private handleSaveScore(): void {
    const name1 = this.playerNameInput1?.value.trim() || "Player 1";

    if (this.gameMode === "single") {
      this.saveRanking1P(name1, this.totalMatchScore1P);
    } else if (this.gameMode === "two") {
      const name2 = this.playerNameInput2?.value.trim() || "Player 2";
      // Save each player's individual score
      this.saveRanking2PIndividual(name1, this.totalMatchScoreP1_2P);
      this.saveRanking2PIndividual(name2, this.totalMatchScoreP2_2P);
    }

    // Update ranking display immediately after saving
    if (this.rankingDisplayElement) {
      // Use the correct getter for 2P individual ranking
      const rankingData = this.gameMode === "single"
        ? this.getRanking1P()
        : this.getRanking2PIndividual();
      this.rankingDisplayElement.innerHTML = this.displayRanking(
        rankingData,
        this.gameMode === "two",
      );
    }

    // Optionally hide save button/inputs after saving
    if (this.playerNameInputContainer) {
      this.playerNameInputContainer.style.display = "none";
    }
    if (this.saveScoreButton) this.saveScoreButton.style.display = "none";

    this.debugControl?.logEvent("Ranking", {
      message: "Score saved.",
      mode: this.gameMode,
    });
  }

  /**
   * Gets the AudioManager instance.
   * @returns The AudioManager instance.
   */
  public getAudioManager(): AudioManager { // Added method
    return this.audioManager;
  }
}
