/**
 * RankingManager.ts
 *
 * Handles saving and retrieving player rankings from localStorage.
 */
import { DebugControl } from "../../components/DebugControl";
import { MatchLengthMode, RankingEntry1P, RankingEntry2PIndividual } from "./types";

export class RankingManager {
    private debugControl?: DebugControl;

    // Constants
    private readonly RANKING_MAX_ENTRIES = 3; // Top 3

    // Base keys for localStorage
    private readonly LOCALSTORAGE_KEY_1P_BASE = "ranking1P";
    private readonly LOCALSTORAGE_KEY_2P_INDIVIDUAL_BASE = "ranking2PIndividual";

    // Get localStorage key for specific match mode
    private getLocalStorageKey1P(matchMode: MatchLengthMode): string {
        return `${this.LOCALSTORAGE_KEY_1P_BASE}_${matchMode}`;
    }

    private getLocalStorageKey2PIndividual(matchMode: MatchLengthMode): string {
        return `${this.LOCALSTORAGE_KEY_2P_INDIVIDUAL_BASE}_${matchMode}`;
    }

    public setDebugControl(debugControl: DebugControl): void {
        this.debugControl = debugControl;
    }

    // --- 1 Player Ranking ---

    public getRanking1P(matchMode: MatchLengthMode): RankingEntry1P[] {
        const key = this.getLocalStorageKey1P(matchMode);
        const stored = localStorage.getItem(key);
        try {
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            this.debugControl?.logEvent("LocalStorageError", {
                message: "Failed to parse 1P ranking",
                matchMode,
                error: e,
            });
            return [];
        }
    }

    public getAllRankings1P(): Record<MatchLengthMode, RankingEntry1P[]> {
        const allRankings: Record<MatchLengthMode, RankingEntry1P[]> = {
            [MatchLengthMode.BestOf3]: this.getRanking1P(MatchLengthMode.BestOf3),
            [MatchLengthMode.BestOf5]: this.getRanking1P(MatchLengthMode.BestOf5),
            [MatchLengthMode.BestOf7]: this.getRanking1P(MatchLengthMode.BestOf7),
        };
        return allRankings;
    }

    public saveRanking1P(name: string, score: number, matchMode: MatchLengthMode): RankingEntry1P[] {
        if (!name || score < 0) {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Invalid name or score for 1P",
                name,
                score,
                matchMode,
            });
            return this.getRanking1P(matchMode); // Return current ranking without changes
        }
        const rankings = this.getRanking1P(matchMode);
        const newEntry: RankingEntry1P = {
            name: name.substring(0, 15),
            score,
            matchMode
        }; // Limit name length

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
                    this.getLocalStorageKey1P(matchMode),
                    JSON.stringify(updatedRankings),
                );
                this.debugControl?.logEvent("RankingSaved", {
                    mode: "1P",
                    matchMode,
                    entry: newEntry,
                });
            } catch (e) {
                this.debugControl?.logEvent("LocalStorageError", {
                    message: "Failed to save 1P ranking",
                    matchMode,
                    error: e,
                });
                // If save fails, return the original rankings before attempting the add/sort
                return this.getRanking1P(matchMode);
            }
        } else {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Score not high enough for 1P Top 3",
                name,
                score,
                matchMode,
                rankings,
            });
        }
        return updatedRankings; // Return the potentially updated rankings
    }

    /**
     * Checks if a score qualifies for the Top 3 in 1P mode without saving.
     */
    public isTopScore1P(score: number, matchMode: MatchLengthMode): boolean {
        const rankings = this.getRanking1P(matchMode);
        return (
            rankings.length < this.RANKING_MAX_ENTRIES ||
            score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
        );
    }

    // --- 2 Player Individual Ranking ---

    public getRanking2PIndividual(matchMode: MatchLengthMode): RankingEntry2PIndividual[] {
        const key = this.getLocalStorageKey2PIndividual(matchMode);
        const stored = localStorage.getItem(key);
        try {
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            this.debugControl?.logEvent("LocalStorageError", {
                message: "Failed to parse 2P individual ranking",
                matchMode,
                error: e,
            });
            return [];
        }
    }

    public getAllRankings2PIndividual(): Record<MatchLengthMode, RankingEntry2PIndividual[]> {
        const allRankings: Record<MatchLengthMode, RankingEntry2PIndividual[]> = {
            [MatchLengthMode.BestOf3]: this.getRanking2PIndividual(MatchLengthMode.BestOf3),
            [MatchLengthMode.BestOf5]: this.getRanking2PIndividual(MatchLengthMode.BestOf5),
            [MatchLengthMode.BestOf7]: this.getRanking2PIndividual(MatchLengthMode.BestOf7),
        };
        return allRankings;
    }

    public saveRanking2PIndividual(
        name: string,
        score: number,
        matchMode: MatchLengthMode
    ): RankingEntry2PIndividual[] {
        if (!name || score < 0) {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Invalid name or score for 2P individual",
                name,
                score,
                matchMode,
            });
            return this.getRanking2PIndividual(matchMode); // Return current ranking
        }
        const rankings = this.getRanking2PIndividual(matchMode);
        const newEntry: RankingEntry2PIndividual = {
            name: name.substring(0, 15),
            score,
            matchMode,
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
                    this.getLocalStorageKey2PIndividual(matchMode),
                    JSON.stringify(updatedRankings),
                );
                this.debugControl?.logEvent("RankingSaved", {
                    mode: "2P Individual",
                    matchMode,
                    entry: newEntry,
                });
            } catch (e) {
                this.debugControl?.logEvent("LocalStorageError", {
                    message: "Failed to save 2P individual ranking",
                    matchMode,
                    error: e,
                });
                // If save fails, return the original rankings before attempting the add/sort
                return this.getRanking2PIndividual(matchMode);
            }
        } else {
            this.debugControl?.logEvent("RankingSaveSkipped", {
                reason: "Score not high enough for 2P Top 3",
                name,
                score,
                matchMode,
                rankings,
            });
        }
        return updatedRankings; // Return the potentially updated rankings
    }

    /**
     * Checks if a score qualifies for the Top 3 in 2P Individual mode without saving.
     */
    public isTopScore2PIndividual(score: number, matchMode: MatchLengthMode): boolean {
        const rankings = this.getRanking2PIndividual(matchMode);
        return (
            rankings.length < this.RANKING_MAX_ENTRIES ||
            score > (rankings[this.RANKING_MAX_ENTRIES - 1]?.score ?? -1)
        );
    }
}
