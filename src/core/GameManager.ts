/**
 * GameManager.ts (Entry Point)
 *
 * Re-exports the refactored GameManager from the game-manager directory.
 * This maintains backward compatibility for imports.
 */
export { GameManager } from "./game-manager/GameManager";

// Re-export types commonly used alongside GameManager
export * from "./game-manager/types";
