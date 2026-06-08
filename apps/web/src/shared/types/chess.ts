import type { Square } from '@mandalorian-chess/chess-engine'

export type {
  CastlingRights,
  Color,
  EndReason,
  GameEndResult,
  GameResult,
  GameState,
  MoveResult,
  Piece,
  PieceType,
  PromotionPiece,
  Square,
} from '@mandalorian-chess/chess-engine'

export { Game } from '@mandalorian-chess/chess-engine'

export type Faction = 'mandalorian' | 'imperial'

export function squareToCoords(square: string): { file: number; rank: number } {
  return {
    file: square.charCodeAt(0) - 97,
    rank: Number.parseInt(square[1], 10) - 1,
  }
}

export function coordsToSquare(file: number, rank: number): Square {
  return `${'abcdefgh'[file]}${rank + 1}` as Square
}
