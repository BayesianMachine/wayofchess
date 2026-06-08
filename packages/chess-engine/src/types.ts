export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
export type Square = `${File}${Rank}`
export type Color = 'w' | 'b'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type PromotionPiece = 'n' | 'b' | 'r' | 'q'

export interface Piece {
  type: PieceType
  color: Color
}

export interface MoveResult {
  san: string
  from: Square
  to: Square
  piece: PieceType
  captured?: PieceType
  promotion?: PromotionPiece
  flags: string
  isCheck: boolean
  isCheckmate: boolean
}

export interface CastlingRights {
  white: { kingSide: boolean; queenSide: boolean }
  black: { kingSide: boolean; queenSide: boolean }
}

export interface GameState {
  fen: string
  turn: Color
  fullMoveNumber: number
  halfMoveClock: number
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  isDraw: boolean
  isInsufficientMaterial: boolean
  isThreefoldRepetition: boolean
  isFiftyMoveRule: boolean
  isGameOver: boolean
  legalMoves: MoveResult[]
  castlingRights: CastlingRights
  enPassantTarget: Square | null
}

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*'
export type EndReason =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'fifty_move_rule'
  | 'resignation'
  | 'timeout'
  | 'agreement'
  | 'abort'
  | 'unknown'

export interface GameEndResult {
  result: GameResult
  reason: EndReason
}

export interface PositionEval {
  moveNumber: number
  color: 'w' | 'b'
  san: string
  centipawnLoss: number
  annotation: 'brilliant' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | null
}
