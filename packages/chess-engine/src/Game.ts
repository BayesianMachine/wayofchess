import { Chess, type Color as ChessColor, type Move, type Square as ChessSquare } from 'chess.js'
import type {
  CastlingRights,
  Color,
  GameEndResult,
  GameResult,
  GameState,
  MoveResult,
  Piece,
  PieceType,
  PromotionPiece,
  Square,
} from './types.js'

type VerboseMove = Move

function parseFenFields(fen: string): { halfMoveClock: number; fullMoveNumber: number; enPassant: string } {
  const parts = fen.split(/\s+/)
  return {
    halfMoveClock: parseInt(parts[4] ?? '0', 10),
    fullMoveNumber: parseInt(parts[5] ?? '1', 10),
    enPassant: parts[3] ?? '-',
  }
}

function toSquare(s: string): Square {
  return s as Square
}

function toPieceType(p: string): PieceType {
  return p as PieceType
}

function toPromotionPiece(p: string | undefined): PromotionPiece | undefined {
  if (p === undefined) return undefined
  return p as PromotionPiece
}

function mapVerboseMove(move: VerboseMove, isCheck = false, isCheckmate = false): MoveResult {
  return {
    san: move.san,
    from: toSquare(move.from),
    to: toSquare(move.to),
    piece: toPieceType(move.piece),
    captured: move.captured !== undefined ? toPieceType(move.captured) : undefined,
    promotion: toPromotionPiece(move.promotion),
    flags: move.flags,
    isCheck,
    isCheckmate,
  }
}

function getCastlingRights(chess: Chess): CastlingRights {
  const white = chess.getCastlingRights('w' as ChessColor)
  const black = chess.getCastlingRights('b' as ChessColor)
  return {
    white: { kingSide: white.k, queenSide: white.q },
    black: { kingSide: black.k, queenSide: black.q },
  }
}

function getEnPassantTarget(fen: string): Square | null {
  const { enPassant } = parseFenFields(fen)
  if (enPassant === '-') return null
  return toSquare(enPassant)
}

function isFiftyMoveRule(chess: Chess): boolean {
  const chessWithFifty = chess as Chess & { isFiftyMoveRule?: () => boolean; isDrawByFiftyMoves?: () => boolean }
  if (typeof chessWithFifty.isFiftyMoveRule === 'function') {
    return chessWithFifty.isFiftyMoveRule()
  }
  if (typeof chessWithFifty.isDrawByFiftyMoves === 'function') {
    return chessWithFifty.isDrawByFiftyMoves()
  }
  return parseFenFields(chess.fen()).halfMoveClock >= 100
}

export class Game {
  private chess: Chess

  constructor(fen?: string) {
    this.chess = new Chess(fen)
  }

  move(from: Square, to: Square, promotion?: PromotionPiece): MoveResult | null {
    try {
      const result = this.chess.move({
        from: from as ChessSquare,
        to: to as ChessSquare,
        promotion,
      })
      if (result === null) return null
      const isCheck = this.chess.isCheck()
      const isCheckmate = this.chess.isCheckmate()
      return mapVerboseMove(result, isCheck, isCheckmate)
    } catch {
      return null
    }
  }

  getState(): GameState {
    const fen = this.chess.fen()
    const { halfMoveClock, fullMoveNumber } = parseFenFields(fen)
    const verboseMoves = this.chess.moves({ verbose: true }) as VerboseMove[]

    return {
      fen,
      turn: this.chess.turn() as Color,
      fullMoveNumber,
      halfMoveClock,
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      isInsufficientMaterial: this.chess.isInsufficientMaterial(),
      isThreefoldRepetition: this.chess.isThreefoldRepetition(),
      isFiftyMoveRule: isFiftyMoveRule(this.chess),
      isGameOver: this.chess.isGameOver(),
      legalMoves: verboseMoves.map((m) => mapVerboseMove(m)),
      castlingRights: getCastlingRights(this.chess),
      enPassantTarget: getEnPassantTarget(fen),
    }
  }

  getLegalMovesFrom(square: Square): Square[] {
    const moves = this.chess.moves({
      square: square as ChessSquare,
      verbose: true,
    }) as VerboseMove[]
    return moves.map((m) => toSquare(m.to))
  }

  undo(): boolean {
    const result = this.chess.undo()
    return result !== null
  }

  toFEN(): string {
    return this.chess.fen()
  }

  toPGN(): string {
    return this.chess.pgn()
  }

  loadPGN(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn)
      return true
    } catch {
      return false
    }
  }

  getPiece(square: Square): Piece | null {
    const piece = this.chess.get(square as ChessSquare)
    if (!piece) return null
    return {
      type: toPieceType(piece.type),
      color: piece.color as Color,
    }
  }

  getBoard(): (Piece | null)[][] {
    const board = this.chess.board()
    return board.map((rank) =>
      rank.map((cell) => {
        if (cell === null) return null
        return {
          type: toPieceType(cell.type),
          color: cell.color as Color,
        }
      }),
    )
  }

  getHistory(): MoveResult[] {
    const history = this.chess.history({ verbose: true }) as VerboseMove[]
    return history.map((m) => mapVerboseMove(m))
  }

  isDrawByRepetition(): boolean {
    return this.chess.isThreefoldRepetition()
  }

  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial()
  }

  reset(): void {
    this.chess.reset()
  }

  getGameEndResult(): GameEndResult | null {
    if (!this.chess.isGameOver()) return null

    let reason: GameEndResult['reason'] = 'unknown'
    let result: GameResult = '1/2-1/2'

    if (this.chess.isCheckmate()) {
      reason = 'checkmate'
      result = this.chess.turn() === 'w' ? '0-1' : '1-0'
    } else if (this.chess.isStalemate()) {
      reason = 'stalemate'
      result = '1/2-1/2'
    } else if (this.chess.isInsufficientMaterial()) {
      reason = 'insufficient_material'
      result = '1/2-1/2'
    } else if (this.chess.isThreefoldRepetition()) {
      reason = 'threefold_repetition'
      result = '1/2-1/2'
    } else if (isFiftyMoveRule(this.chess)) {
      reason = 'fifty_move_rule'
      result = '1/2-1/2'
    } else if (this.chess.isDraw()) {
      result = '1/2-1/2'
      reason = 'unknown'
    }

    return { result, reason }
  }
}
