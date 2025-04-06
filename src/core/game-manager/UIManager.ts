/**
 * UIManager.ts
 *
 * Handles interactions with the DOM elements for displaying game information,
 * modals, and rankings.
 */
import { DebugControl } from "../../components/DebugControl";
import { AudioManager } from "../AudioManager";
import {
    GameMode,
    RankingEntry1P,
    RankingEntry2PIndividual,
    RoundResult,
} from "./types";

export class UIManager {
    private debugControl?: DebugControl;
    private audioManager: AudioManager; // Needed for button clicks

    // DOM elements for displaying game information
    private roundScoreElement!: HTMLElement;
    private scoreElement!: HTMLElement;
    private playerTurnElement!: HTMLElement;
    private matchScoreElement: HTMLElement | null = null;

    // Game start modal elements
    private gameStartModal!: HTMLElement;
    private onePlayerButton!: HTMLElement;
    private twoPlayerButton!: HTMLElement;

    // Match over modal elements
    private matchOverModal!: HTMLElement;
    private finalMatchScoreElement!: HTMLElement;
    private restartButton!: HTMLElement;
    private roundSummaryElement: HTMLElement | null = null;
    private playerNameInputContainer: HTMLElement | null = null;
    private playerNameInput1: HTMLInputElement | null = null;
    private playerNameInput2: HTMLInputElement | null = null;
    private saveScoreButton: HTMLElement | null = null;
    private rankingDisplayElement: HTMLElement | null = null;

    // Callbacks for button actions
    private onStartGame: (mode: GameMode) => void;
    private onRestartMatch: () => void;
    private onSaveScore: (name1: string, name2?: string) => void;

    constructor(
        audioManager: AudioManager,
        onStartGame: (mode: GameMode) => void,
        onRestartMatch: () => void,
        onSaveScore: (name1: string, name2?: string) => void,
    ) {
        this.audioManager = audioManager;
        this.onStartGame = onStartGame;
        this.onRestartMatch = onRestartMatch;
        this.onSaveScore = onSaveScore;
        this.initializeUIElements();
    }

    public setDebugControl(debugControl: DebugControl): void {
        this.debugControl = debugControl;
    }

    /**
     * Initializes UI elements by getting references to the DOM elements and setting up listeners.
     */
    private initializeUIElements(): void {
        // Get references to game info elements
        this.roundScoreElement = document.getElementById(
            "round-score-display",
        ) as HTMLElement;
        this.scoreElement = document.getElementById(
            "score-display",
        ) as HTMLElement;
        this.matchScoreElement = document.getElementById("match-score-display");

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
            this.onStartGame("single");
        });
        this.twoPlayerButton.addEventListener("click", () => {
            this.audioManager.playSound("plop_02", 0.7);
            this.onStartGame("two");
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
        this.roundSummaryElement = document.getElementById("round-summary");
        this.playerNameInputContainer = document.getElementById(
            "player-name-input-container",
        );
        this.playerNameInput1 = document.getElementById(
            "player-name-input-1",
        ) as HTMLInputElement | null;
        this.playerNameInput2 = document.getElementById(
            "player-name-input-2",
        ) as HTMLInputElement | null;
        this.saveScoreButton = document.getElementById("save-score-button");
        this.rankingDisplayElement = document.getElementById("ranking-display");

        // Add click event to restart button
        this.restartButton.addEventListener("click", () => {
            this.audioManager.playSound("pop", 0.7);
            this.onRestartMatch();
        });

        // Add click event to save score button
        if (this.saveScoreButton) {
            this.saveScoreButton.addEventListener("click", () => {
                const name1 = this.playerNameInput1?.value.trim() || "Player 1";
                const name2 = this.playerNameInput2?.value.trim() || undefined; // Pass undefined if not 2P
                this.onSaveScore(name1, name2); // Pass names to callback

                // Optionally hide save button/inputs after saving (handled by GameManager after save logic)
                // if (this.playerNameInputContainer) this.playerNameInputContainer.style.display = "none";
                // if (this.saveScoreButton) this.saveScoreButton.style.display = "none";
            });
        } else {
            this.debugControl?.logEvent("UIWarning", {
                message: "Save score button not found!",
            });
        }

        // Initial display updates will be called by GameManager after initialization
    }

    /**
     * Updates the round score display (Best of 7)
     */
    public updateRoundScoreDisplay(
        gameMode: GameMode,
        currentRoundNumber: number,
        player1RoundsWon: number,
    ): void {
        if (gameMode === "single") {
            this.roundScoreElement.textContent =
                `Round: ${currentRoundNumber} | Won: ${player1RoundsWon}`;
        } else if (gameMode === "two") {
            this.roundScoreElement.textContent = `Round ${currentRoundNumber}`;
        } else {
            this.roundScoreElement.textContent = ""; // Hide before game start
        }
    }

    /**
     * Updates the current match score display (rounds won)
     */
    public updateMatchScoreDisplay(
        gameMode: GameMode,
        player1RoundsWon: number,
        player2RoundsWon: number,
    ): void {
        if (!this.matchScoreElement) return;

        if (gameMode === "single") {
            this.matchScoreElement.style.display = "none";
        } else if (gameMode === "two") {
            this.matchScoreElement.textContent =
                `Match: P1 ${player1RoundsWon} - P2 ${player2RoundsWon}`;
            this.matchScoreElement.style.display = "block";
        } else {
            this.matchScoreElement.style.display = "none";
        }
    }

    /**
     * Updates the current round's score/attempt display based on the current game mode
     */
    public updateScoreDisplay(
        gameMode: GameMode,
        currentPlayer: 1 | 2,
        score: number,
        attempts: number, // For single player
        player1Score: number,
        player1Attempts: number, // For two player
        player2Score: number,
        player2Attempts: number, // For two player
    ): void {
        if (gameMode === "single") {
            this.scoreElement.textContent = `Score: ${score}/${attempts}`;
            this.playerTurnElement.style.display = "none";
        } else if (gameMode === "two") {
            this.scoreElement.textContent =
                `P1: ${player1Score}/${player1Attempts} | P2: ${player2Score}/${player2Attempts}`;
            this.playerTurnElement.textContent =
                `Turn: Player ${currentPlayer}`;
            this.playerTurnElement.style.display = "block";
        } else {
            this.scoreElement.textContent = "Score: 0/0";
            this.playerTurnElement.style.display = "none";
        }
    }

    /**
     * Shows the game start modal with options for number of players
     */
    public showGameStartModal(): void {
        this.gameStartModal.style.opacity = "1";
        this.gameStartModal.style.pointerEvents = "auto";
    }

    /**
     * Hides the game start modal
     */
    public hideGameStartModal(): void {
        this.gameStartModal.style.opacity = "0";
        this.gameStartModal.style.pointerEvents = "none";
    }

    /**
     * Shows the match over modal with final match stats, summary, ranking, and save options.
     */
    public showMatchOverModal(
        gameMode: GameMode,
        player1RoundsWon: number,
        player2RoundsWon: number,
        totalMatchScore1P: number, // For 1P final score display
        roundHistory: RoundResult[],
        rankingData: RankingEntry1P[] | RankingEntry2PIndividual[], // Combined type
    ): void {
        let finalMessage = "";
        let showSaveOption = false;

        if (gameMode === "single") {
            finalMessage = `Match Complete! Final Score: ${totalMatchScore1P}`;
            showSaveOption = true;
        } else if (gameMode === "two") {
            const winner = player1RoundsWon > player2RoundsWon
                ? "Player 1"
                : "Player 2";
            finalMessage =
                `${winner} Wins the Match!\nFinal Score: ${player1RoundsWon} - ${player2RoundsWon}`;
            showSaveOption = true;
        }

        this.finalMatchScoreElement.textContent = finalMessage;

        // Display Round Summary
        if (this.roundSummaryElement) {
            this.roundSummaryElement.innerHTML = this.displayRoundSummary(
                gameMode,
                roundHistory,
            );
            this.roundSummaryElement.style.display = "block";
        }

        // Display Ranking
        if (this.rankingDisplayElement) {
            this.rankingDisplayElement.innerHTML = this.displayRanking(
                rankingData,
                gameMode === "two",
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
                (showSaveOption && gameMode === "two")
                    ? "inline-block"
                    : "none";
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
    public hideMatchOverModal(): void {
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
     * Generates HTML for the round summary.
     */
    private displayRoundSummary(
        gameMode: GameMode,
        history: RoundResult[],
    ): string {
        if (!history || history.length === 0) {
            return "<p>No rounds played yet.</p>";
        }

        let summaryHtml = "<h4>Round Summary</h4><ul>";
        history.forEach((result) => {
            if (gameMode === "single") {
                summaryHtml +=
                    `<li>Round ${result.round}: ${result.scoreP1}/${result.attemptsP1} (Score: ${
                        result.roundScore1P ?? "N/A"
                    })</li>`;
            } else {
                summaryHtml +=
                    `<li>Round ${result.round}: P1 ${result.scoreP1}/${result.attemptsP1} (Score: ${
                        result.roundScoreP1_2P ?? "N/A"
                    }) | P2 ${result.scoreP2 ?? 0}/${
                        result.attemptsP2 ?? 0
                    } (Score: ${result.roundScoreP2_2P ?? "N/A"})</li>`;
            }
        });
        summaryHtml += "</ul>";
        return summaryHtml;
    }

    /**
     * Generates HTML for the ranking display.
     */
    private displayRanking(
        rankingData: RankingEntry1P[] | RankingEntry2PIndividual[],
        is2P: boolean,
    ): string {
        let rankingHtml = `<h4>Ranking (${
            is2P ? "2 Player - Top Scores" : "1 Player - Top Scores"
        })</h4>`;
        if (!rankingData || rankingData.length === 0) {
            rankingHtml += "<p>No rankings yet.</p>";
            return rankingHtml;
        }

        rankingHtml += "<ol>";
        rankingData.forEach((entry) => {
            // Use type assertion or check properties to differentiate
            if ("scoreP1" in entry || "scoreP2" in entry) { // Simple check, adjust if needed
                // This case shouldn't happen with the combined type, but as a safeguard
                // Or handle RankingEntry2PTeam if it existed
            } else if (is2P) {
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

    /**
     * Updates the ranking display within the match over modal *after* a save.
     */
    public updateRankingDisplay(
        rankingData: RankingEntry1P[] | RankingEntry2PIndividual[],
        is2P: boolean,
    ): void {
        if (this.rankingDisplayElement) {
            this.rankingDisplayElement.innerHTML = this.displayRanking(
                rankingData,
                is2P,
            );
        }
        // Hide save elements after successful save
        if (this.playerNameInputContainer) {
            this.playerNameInputContainer.style.display = "none";
        }
        if (this.saveScoreButton) this.saveScoreButton.style.display = "none";
    }
}
