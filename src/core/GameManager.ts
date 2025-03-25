/**
 * GameManager.ts
 *
 * This file contains the GameManager class, which centralizes game state information
 * such as player score, attempts, and provides methods for game events.
 */

import Matter from "matter-js";
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
        this.createGameDisplay();
        this.createGameOverModal();
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
     * Creates the game information display elements
     */
    private createGameDisplay(): void {
        // Create container for game information
        const gameInfoContainer = document.createElement("div");
        gameInfoContainer.id = "game-info-container";
        gameInfoContainer.style.position = "absolute";
        gameInfoContainer.style.top = "20px";
        gameInfoContainer.style.right = "20px";
        gameInfoContainer.style.display = "flex";
        gameInfoContainer.style.flexDirection = "column";
        gameInfoContainer.style.gap = "10px";
        gameInfoContainer.style.zIndex = "1000";

        // Create score display element
        this.scoreElement = document.createElement("div");
        this.scoreElement.id = "score-display";
        this.scoreElement.style.padding = "10px 20px";
        this.scoreElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        this.scoreElement.style.color = "white";
        this.scoreElement.style.fontSize = "24px";
        this.scoreElement.style.fontFamily = "Arial, sans-serif";
        this.scoreElement.style.borderRadius = "5px";
        /* cannot select text */
        this.scoreElement.style.userSelect = "none";

        // Create attempts display element
        this.attemptsElement = document.createElement("div");
        this.attemptsElement.id = "attempts-display";
        this.attemptsElement.style.padding = "10px 20px";
        this.attemptsElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        this.attemptsElement.style.color = "white";
        this.attemptsElement.style.fontSize = "24px";
        this.attemptsElement.style.fontFamily = "Arial, sans-serif";
        this.attemptsElement.style.borderRadius = "5px";
        /* cannot select text */
        this.attemptsElement.style.userSelect = "none";

        // Update displays with initial values
        this.updateScoreDisplay();
        this.updateAttemptsDisplay();

        // Add elements to container
        gameInfoContainer.appendChild(this.scoreElement);
        gameInfoContainer.appendChild(this.attemptsElement);

        // Add container to document body
        document.body.appendChild(gameInfoContainer);
    }

    /**
     * Creates the game over modal
     */
    private createGameOverModal(): void {
        // Create modal container
        this.gameOverModal = document.createElement("div");
        this.gameOverModal.id = "game-over-modal";
        this.gameOverModal.style.position = "fixed";
        this.gameOverModal.style.top = "0";
        this.gameOverModal.style.left = "0";
        this.gameOverModal.style.width = "100%";
        this.gameOverModal.style.height = "100%";
        this.gameOverModal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.gameOverModal.style.display = "flex";
        this.gameOverModal.style.justifyContent = "center";
        this.gameOverModal.style.alignItems = "center";
        this.gameOverModal.style.zIndex = "2000";
        this.gameOverModal.style.opacity = "0";
        this.gameOverModal.style.transition = "opacity 0.5s ease";
        this.gameOverModal.style.pointerEvents = "none";

        // Create modal content
        const modalContent = document.createElement("div");
        modalContent.style.backgroundColor = "white";
        modalContent.style.padding = "30px";
        modalContent.style.borderRadius = "10px";
        modalContent.style.textAlign = "center";
        modalContent.style.maxWidth = "400px";

        // Create game over title
        const gameOverTitle = document.createElement("h2");
        gameOverTitle.textContent = "Game Over!";
        gameOverTitle.style.fontSize = "32px";
        gameOverTitle.style.marginBottom = "20px";
        gameOverTitle.style.color = "#333";

        // Create congratulations message
        const congratsMessage = document.createElement("p");
        congratsMessage.textContent =
            "Congratulations! You've collected all objects!";
        congratsMessage.style.fontSize = "18px";
        congratsMessage.style.marginBottom = "20px";
        congratsMessage.style.color = "#555";

        // Create final score element
        this.finalScoreElement = document.createElement("p");
        this.finalScoreElement.style.fontSize = "20px";
        this.finalScoreElement.style.marginBottom = "10px";
        this.finalScoreElement.style.fontWeight = "bold";

        // Create final attempts element
        this.finalAttemptsElement = document.createElement("p");
        this.finalAttemptsElement.style.fontSize = "20px";
        this.finalAttemptsElement.style.marginBottom = "30px";
        this.finalAttemptsElement.style.fontWeight = "bold";

        // Create restart button
        const restartButton = document.createElement("button");
        restartButton.textContent = "Play Again";
        restartButton.style.backgroundColor = "#4CAF50";
        restartButton.style.color = "white";
        restartButton.style.border = "none";
        restartButton.style.padding = "12px 24px";
        restartButton.style.fontSize = "18px";
        restartButton.style.borderRadius = "5px";
        restartButton.style.cursor = "pointer";
        restartButton.style.transition = "background-color 0.3s ease";

        // Add hover effect
        restartButton.onmouseover = () => {
            restartButton.style.backgroundColor = "#45a049";
        };
        restartButton.onmouseout = () => {
            restartButton.style.backgroundColor = "#4CAF50";
        };

        // Add click event to restart the game
        restartButton.onclick = () => {
            this.restartGame();
        };

        // Assemble modal content
        modalContent.appendChild(gameOverTitle);
        modalContent.appendChild(congratsMessage);
        modalContent.appendChild(this.finalScoreElement);
        modalContent.appendChild(this.finalAttemptsElement);
        modalContent.appendChild(restartButton);

        // Add content to modal
        this.gameOverModal.appendChild(modalContent);

        // Add modal to document body
        document.body.appendChild(this.gameOverModal);
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
