/**
 * RankingManager.ts
 *
 * Handles saving and retrieving player rankings from localStorage.
 */
import { DebugControl } from "../../components/DebugControl";
import { RankingEntry1P, RankingEntry2PIndividual } from "./types";

export class RankingManager {
    private debugControl?: DebugControl;

    // Constants
    private readonly RANKING_MAX_ENTRIES = 3; // Top 3
    private readonly LOCALSTORAGE_KEY_1P = "ranking1P";
    private readonly LOCALSTORAGE_KEY_2P_INDIVIDUAL = "ranking2PIndividual";

    public setDebugControl(debugControl: DebugControl): void {
        this.debugControl = debugControl;
    }

    // --- 1 Player Ranking ---

    public getRanking1P(): RankingEntry1P[] {
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

    public saveRanking1P(name: string, score: number): RankingEntry1P[] {
        if (!name || score < 0) {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Invalid name or score for 1P",
                name,
                score,
            });
            return this.getRanking1P(); // Return current ranking without changes
        }
        const rankings = this.getRanking1P();
        const newEntry: RankingEntry1P = { name: name.substring(0, 15), score }; // Limit name length

        let updatedRankings = rankings;
        if (
            rankings.length < this.RANKING_MAX_ENTRIES ||
            score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
        ) {
            rankings.push(newEntry);
            rankings.sort((a, b) => b.score - a.score); // Sort descending
            updatedRankings = rankings.slice(0, this.RANKING_MAX_ENTRIES); // Keep top entries
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
                // If save fails, return the original rankings before attempting the add/sort
                return this.getRanking1P();
            }
        } else {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Score not high enough for 1P Top 3",
                name,
                score,
                rankings,
            });
        }
        return updatedRankings; // Return the potentially updated rankings
    }

    /**
     * Checks if a score qualifies for the Top 3 in 1P mode without saving.
     */
    public isTopScore1P(score: number): boolean {
        const rankings = this.getRanking1P();
        return (
            rankings.length < this.RANKING_MAX_ENTRIES ||
            score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
        );
    }

    // --- 2 Player Individual Ranking ---

    public getRanking2PIndividual(): RankingEntry2PIndividual[] {
        const stored = localStorage.getItem(
            this.LOCALSTORAGE_KEY_2P_INDIVIDUAL,
        );
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

    public saveRanking2PIndividual(
        name: string,
        score: number,
    ): RankingEntry2PIndividual[] {
        if (!name || score < 0) {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Invalid name or score for 2P individual",
                name,
                score,
            });
            return this.getRanking2PIndividual(); // Return current ranking
        }
        const rankings = this.getRanking2PIndividual();
        const newEntry: RankingEntry2PIndividual = {
            name: name.substring(0, 15),
            score,
        };

        let updatedRankings = rankings;
        if (
            rankings.length < this.RANKING_MAX_ENTRIES ||
            score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
        ) {
            rankings.push(newEntry);
            rankings.sort((a, b) => b.score - a.score); // Sort descending
            updatedRankings = rankings.slice(0, this.RANKING_MAX_ENTRIES); // Keep top entries
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
                // If save fails, return the original rankings before attempting the add/sort
                return this.getRanking2PIndividual();
            }
        } else {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Score not high enough for 2P Top 3",
                name,
                score,
                rankings,
            });
        }
        return updatedRankings; // Return the potentially updated rankings
    }

    /**
     * Checks if a score qualifies for the Top 3 in 2P Individual mode without saving.
     */
    public isTopScore2PIndividual(score: number): boolean {
        const rankings = this.getRanking2PIndividual();
        return (
            rankings.length < this.RANKING_MAX_ENTRIES ||
            score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
        );
    }
}
