/**
 * GameManager.ts
 * 
 * This file contains the GameManager class, which centralizes game state information
 * such as player score, attempts, and provides methods for game events.
 */

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

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        this.createGameDisplay();
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
        
        // Create attempts display element
        this.attemptsElement = document.createElement("div");
        this.attemptsElement.id = "attempts-display";
        this.attemptsElement.style.padding = "10px 20px";
        this.attemptsElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        this.attemptsElement.style.color = "white";
        this.attemptsElement.style.fontSize = "24px";
        this.attemptsElement.style.fontFamily = "Arial, sans-serif";
        this.attemptsElement.style.borderRadius = "5px";
        
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
     * Increments the player's score
     * 
     * @param points - Number of points to add (default: 1)
     */
    public addScore(points: number = 1): void {
        this.score += points;
        this.updateScoreDisplay();
        console.log(`Score increased! Current score: ${this.score}`);
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
    }
}
