// Re-exports from @mandalorian-chess/chess-engine and @mandalorian-chess/shared-types
// This file is the single import boundary — all web components import from here, never directly from the packages.
export { Game } from '@mandalorian-chess/chess-engine';
export { TIME_CONTROLS, getRankTier, getRankTitle, getRankProgress, getNextRank, RANK_TIERS, } from '@mandalorian-chess/shared-types';
export function squareToCoords(sq) {
    return { file: sq.charCodeAt(0) - 97, rank: parseInt(sq[1]) - 1 };
}
export function coordsToSquare(file, rank) {
    return `${'abcdefgh'[file]}${rank + 1}`;
}
