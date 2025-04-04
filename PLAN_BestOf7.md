# Plan: Implement "Best of 7" Match Structure

**Goal:** Implement a "Best of 7" match structure. The first player to win 4 rounds wins the match. The match also ends if a player leads 4-0. The number of shapes remains constant each round. The player who starts the next round alternates in two-player mode.

**Detailed Plan:**

1.  **Update `index.html`:**
    *   Add a new HTML element to display the round scores, positioned to the left of the existing score/attempt display.
        *   Example: `<div id="round-score-display">P1: 0 | P2: 0</div>` within the `#game-info-container`.
    *   Modify the text in the game over modal (`#game-over-modal`) to reflect "Match Over" and display the final match score (e.g., "Player 1 Wins the Match 4-2!"). Update relevant element IDs if needed (e.g., `#final-score` might become `#final-match-score`).

2.  **Modify `src/core/GameManager.ts`:**
    *   **Add State Variables:**
        *   `player1RoundsWon: number = 0;`
        *   `player2RoundsWon: number = 0;`
        *   `currentRoundNumber: number = 1;`
        *   `startingPlayerThisRound: 1 | 2 = 1;` (Tracks who should start the current round in 2P mode)
        *   `isMatchOver: boolean = false;`
    *   **Add UI Element Reference:**
        *   `private roundScoreElement: HTMLElement;`
    *   **Update `initializeUIElements`:**
        *   Get the reference to the new `#round-score-display` element.
        *   Initialize its text content.
        *   Potentially update references/IDs for the game over modal elements if changed in HTML.
    *   **Refactor `resetGame`:**
        *   Modify the parameter: `resetGame(resetType: 'fullMatchRestart' | 'nextRoundSetup')`.
        *   **`fullMatchRestart` logic:**
            *   Reset `player1RoundsWon = 0`, `player2RoundsWon = 0`.
            *   Reset `currentRoundNumber = 1`.
            *   Set `startingPlayerThisRound = 1`.
            *   Set `isMatchOver = false`.
            *   Reset round scores/attempts (`this.score = 0`, `this.attempts = 0`, etc.).
            *   Reset `firstAttemptMade = false`.
            *   Set `currentPlayer = 1` (Player 1 always starts the match).
            *   Update all UI displays (round score, attempt score).
            *   *Do not* call `showGameStartModal()` here.
        *   **`nextRoundSetup` logic:**
            *   Increment `currentRoundNumber`.
            *   Switch `startingPlayerThisRound` (`this.startingPlayerThisRound = this.startingPlayerThisRound === 1 ? 2 : 1;`).
            *   Set `currentPlayer = this.startingPlayerThisRound`.
            *   Reset round scores/attempts (`this.score = 0`, `this.attempts = 0`, etc.).
            *   Reset `firstAttemptMade = false`.
            *   Update attempt score display.
            *   Call the `restartCallback()` (from `main.ts`) to clear the board and trigger shape regeneration.
    *   **Update `startGame`:**
        *   After setting `gameMode`, call `this.resetGame('fullMatchRestart');`.
    *   **Update `restartButton` Event Listener:**
        *   Change the call inside the listener to `this.resetGame('fullMatchRestart');`.
        *   Ensure it also calls `this.hideGameOverModal();` (or the renamed `hideMatchOverModal`).
    *   **Rename `checkGameOver` -> `checkRoundOver`:**
        *   Keep the logic to check if `nonStaticBodies.length === 0`.
        *   If true:
            *   Determine round winner based on `this.lastPlayerToAttempt` (for 2P) or implicitly (for 1P).
            *   Increment `player1RoundsWon` or `player2RoundsWon`.
            *   Update the round score display (`this.updateRoundScoreDisplay()`).
            *   Call `this.checkMatchOver()`.
            *   If `checkMatchOver()` returns `true`:
                *   Set `this.isMatchOver = true;`
                *   Call `this.showMatchOverModal();`
            *   Else (match not over):
                *   Call `this.resetGame('nextRoundSetup');`
    *   **Create `checkMatchOver(): boolean`:**
        *   Return `this.player1RoundsWon === 4 || this.player2RoundsWon === 4;`
    *   **Create `updateRoundScoreDisplay()`:**
        *   Updates the `textContent` of `this.roundScoreElement` based on `player1RoundsWon` and `player2RoundsWon`. Handle single-player display if necessary (maybe just show "Rounds Won: X").
    *   **Rename `showGameOverModal` -> `showMatchOverModal` (and `hideGameOverModal` -> `hideMatchOverModal`):**
        *   Update the logic inside `showMatchOverModal` to display the final *match* score (e.g., "Player X Wins the Match [score1]-[score2]!") based on `player1RoundsWon` and `player2RoundsWon`.
    *   **Update `addAttempt`:**
        *   Ensure `currentPlayer` is switched correctly after each attempt in two-player mode. The `startingPlayerThisRound` variable is only used to set the `currentPlayer` at the *beginning* of a round in `resetGame('nextRoundSetup')`.
    *   **Prevent Actions when Match Over:** Add checks for `this.isMatchOver` in `addScore` and `addAttempt` to prevent actions after the match ends.

3.  **Modify `src/components/InitialShapes.ts`:**
    *   No changes required. The number of shapes generated should remain consistent based on the initial setup.

4.  **Modify `src/main.ts`:**
    *   The `restartCallback` passed to `GameManager` should already handle clearing the board and calling `InitialShapes`. Verify this remains correct. It should effectively prepare the board for the next round when called by `resetGame('nextRoundSetup')`.

**Diagram (Refined Flow):**

```mermaid
graph TD
    subgraph Initialization
        direction LR
        Init1[index.html: Add round score display]
        Init2[GameManager: Add round state vars & UI ref]
        Init3[GameManager.initializeUIElements: Get round score element]
    end

    subgraph Game Start / Full Restart
        direction TB
        Start1[1P/2P Button Click OR Restart Button Click] --> Start2(GameManager.startGame / restartButton Listener);
        Start2 --> Start3(GameManager.resetGame - fullMatchRestart);
        Start3 --> Start4[Reset all match/round scores, set round 1, P1 starts];
        Start4 --> Start5[Update UI (Round & Attempt Scores)];
        Start5 --> Start6(Callback: main.ts clears board);
        Start6 --> Start7(Callback: InitialShapes creates shapes);
        Start7 --> RoundActive;
    end

    subgraph Round Gameplay
        direction TB
        RoundActive --> RA1{Player Action (Attempt)};
        RA1 -- Check isMatchOver=false --> RA2[GameManager.addAttempt];
        RA2 --> RA3[Update Attempt Score UI];
        RA2 --> RA4[Switch currentPlayer (2P)];
        RoundActive --> RB1{Shape Pocketed?};
        RB1 -- Check isMatchOver=false --> RB2[GameManager.addScore];
        RB2 --> RB3[Update Attempt Score UI];
        RB3 --> RB4{All Shapes Pocketed?};
        RB4 -- Yes --> RoundOver;
        RB4 -- No --> RoundActive;
        RB1 -- No --> RoundActive;
    end

    subgraph Round End & Match Check
        direction TB
        RoundOver --> RE1[GameManager.checkRoundOver];
        RE1 --> RE2{Determine Round Winner};
        RE2 --> RE3[Increment playerXRoundsWon];
        RE3 --> RE4[Update Round Score UI];
        RE4 --> RE5{GameManager.checkMatchOver (Wins === 4?)};
        RE5 -- Yes --> MatchOver;
        RE5 -- No --> NextRound;
    end

    subgraph Next Round Setup
        direction TB
        NextRound --> NR1(GameManager.resetGame - nextRoundSetup);
        NR1 --> NR2[Increment round number, switch starting player];
        NR2 --> NR3[Reset attempt scores, set currentPlayer];
        NR3 --> NR4[Update Attempt Score UI];
        NR4 --> NR5(Callback: main.ts clears board);
        NR5 --> NR6(Callback: InitialShapes creates shapes);
        NR6 --> RoundActive;
    end

    subgraph Match End
        direction TB
        MatchOver --> ME1[Set isMatchOver = true];
        ME1 --> ME2[GameManager.showMatchOverModal];
        ME2 --> ME3[Display Final Match Score];
    end