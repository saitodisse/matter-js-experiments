/**
 * GameManager.ts
 *
 * This file contains the GameManager class, which centralizes game state information
 * such as player score, attempts, and provides methods for game events.
 */

import { Engine } from "./Engine";

/**
 * GameManager Class
 *
 * Centralizes game state and provides methods for tracking player actions,
 * score, and other game-related information.
 */
export class GameManager {
    // Singleton instance
    private static instance: GameManager;

    // Player's score (number of objects collected)
    private score: number = 0;

    // Number of attempts (forces applied)
    private attempts: number = 0;

    // DOM elements for displaying game information
    private scoreElement: HTMLElement;
    private attemptsElement: HTMLElement;

    // Game over modal elements
    private gameOverModal: HTMLElement;
    private finalScoreElement: HTMLElement;
    private finalAttemptsElement: HTMLElement;
    private restartButton: HTMLElement;

    // Reference to the engine
    private engine: Engine | null = null;

    // Initial number of non-static bodies
    private initialBodyCount: number = 0;

    // Flag to track if the game is over
    private isGameOver: boolean = false;

    // Callback for restarting the game
    private restartCallback: (() => void) | null = null;

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
        this.scoreElement = document.getElementById(
            "score-display",
        ) as HTMLElement;
        this.attemptsElement = document.getElementById(
            "attempts-display",
        ) as HTMLElement;

        // Get references to game over modal elements
        this.gameOverModal = document.getElementById(
            "game-over-modal",
        ) as HTMLElement;
        this.finalScoreElement = document.getElementById(
            "final-score",
        ) as HTMLElement;
        this.finalAttemptsElement = document.getElementById(
            "final-attempts",
        ) as HTMLElement;
        this.restartButton = document.getElementById(
            "restart-button",
        ) as HTMLElement;

        // Add click event to restart button
        this.restartButton.addEventListener("click", () => {
            this.restartGame();
        });

        // Update displays with initial values
        this.updateScoreDisplay();
        this.updateAttemptsDisplay();
    }

    /**
     * Updates the score display with the current score
     */
    private updateScoreDisplay(): void {
        this.scoreElement.textContent = `Score: ${this.score}`;
    }

    /**
     * Updates the attempts display with the current number of attempts
     */
    private updateAttemptsDisplay(): void {
        this.attemptsElement.textContent = `Attempts: ${this.attempts}`;
    }

    /**
     * Shows the game over modal with final stats
     */
    private showGameOverModal(): void {
        // Update final stats
        this.finalScoreElement.textContent = `Final Score: ${this.score}`;
        this.finalAttemptsElement.textContent =
            `Total Attempts: ${this.attempts} (${
                Math.round(this.score / this.attempts * 100)
            }%)`;

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
     * Increments the player's score
     *
     * @param points - Number of points to add (default: 1)
     */
    public addScore(points: number = 1): void {
        this.score += points;
        this.updateScoreDisplay();
        console.log(`Score increased! Current score: ${this.score}`);

        // Check if all bodies have been collected
        this.checkGameOver();
    }

    /**
     * Increments the number of attempts
     *
     * @param count - Number of attempts to add (default: 1)
     */
    public addAttempt(count: number = 1): void {
        this.attempts += count;
        this.updateAttemptsDisplay();
        console.log(`Attempt made! Total attempts: ${this.attempts}`);
    }

    /**
     * Checks if the game is over (all non-static bodies collected)
     */
    public checkGameOver(): void {
        // If the game is already over or engine is not set, return
        if (this.isGameOver || !this.engine) {
            return;
        }

        // Get all non-static bodies in the simulation
        const nonStaticBodies = this.engine.getAllBodies().filter((body) =>
            !body.isStatic
        );

        // If there are no non-static bodies left, the game is over
        if (nonStaticBodies.length === 0 && this.initialBodyCount > 0) {
            this.isGameOver = true;
            console.log("Game over! All bodies collected.");

            // Show the game over modal
            this.showGameOverModal();
        }
    }

    /**
     * Restarts the game
     */
    private restartGame(): void {
        // Hide the game over modal
        this.hideGameOverModal();

        // Reset game state
        this.resetGame();

        // Call the restart callback if set
        if (this.restartCallback) {
            this.restartCallback();
        }
    }

    /**
     * Gets the current score
     *
     * @returns The current score
     */
    public getScore(): number {
        return this.score;
    }

    /**
     * Gets the current number of attempts
     *
     * @returns The current number of attempts
     */
    public getAttempts(): number {
        return this.attempts;
    }

    /**
     * Resets the score to zero
     */
    public resetScore(): void {
        this.score = 0;
        this.updateScoreDisplay();
    }

    /**
     * Resets the number of attempts to zero
     */
    public resetAttempts(): void {
        this.attempts = 0;
        this.updateAttemptsDisplay();
    }

    /**
     * Resets all game statistics
     */
    public resetGame(): void {
        this.resetScore();
        this.resetAttempts();
        this.isGameOver = false;
    }
}
