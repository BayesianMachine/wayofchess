// Re-exports from @mandalorian-chess/chess-engine and @mandalorian-chess/shared-types
// This file is the single import boundary — all web components import from here, never directly from the packages.

import type { Square, GameResult, EndReason } from '@mandalorian-chess/chess-engine'

export type {
  Square,
  Color,
  PieceType,
  PromotionPiece,
  Piece,
  MoveResult,
  GameState,
  GameResult,
  EndReason,
  GameEndResult,
  CastlingRights,
} from '@mandalorian-chess/chess-engine'

export { Game } from '@mandalorian-chess/chess-engine'

export type { Faction, TimeCategory, TimeControl } from '@mandalorian-chess/shared-types'
export {
  TIME_CONTROLS,
  getRankTier,
  getRankTitle,
  getRankProgress,
  getNextRank,
  RANK_TIERS,
} from '@mandalorian-chess/shared-types'

// Types that are local to the web app (not in the packages)
export type AiDifficulty = 'foundling' | 'warrior' | 'champion' | 'mand-alor'

export function squareToCoords(sq: string): { file: number; rank: number } {
  return { file: sq.charCodeAt(0) - 97, rank: parseInt(sq[1]) - 1 }
}

export function coordsToSquare(file: number, rank: number): Square {
  return `${'abcdefgh'[file]}${rank + 1}` as Square
}

export interface MoveAppliedEvent {
  gameId: string
  move: { san: string; from: string; to: string; promotion?: string }
  fen: string
  clocks: { whiteMs: number; blackMs: number }
  spectatorCount: number | string
}

export interface GameEndEvent {
  gameId: string
  result: GameResult
  reason: EndReason
  eloDeltas: { white: number; black: number } | null
}
