import { create } from 'zustand'
import {
  Game,
  type Square,
  type Color,
  type PromotionPiece,
  type MoveResult,
  type GameResult,
  type EndReason,
} from '@/shared/types'
import {
  RECORD_VERSION,
  replayGame,
  type GameRecord,
  type StoredMove,
} from '@/shared/persistence'

interface LocalGameStore {
  gameId: string | null
  chess: Game | null
  startingFen: string
  fen: string
  turn: Color
  status: 'idle' | 'active' | 'ended'
  result: GameResult | null
  endReason: EndReason | null
  moves: MoveResult[]
  storedMoves: StoredMove[]
  selectedSquare: Square | null
  legalMovesFromSelected: Square[]
  lastMove: { from: Square; to: Square } | null
  isCheck: boolean
  timeControlBaseSec: number
  timeControlIncSec: number
  startedAt: number
  updatedAt: number
  warning: string | null

  startLocalGame: (timeControlBaseSec?: number, timeControlIncSec?: number) => void
  restoreGame: (record: GameRecord) => boolean
  selectSquare: (square: Square) => void
  submitMove: (from: Square, to: Square, promotion?: PromotionPiece) => boolean
  endGame: (result: GameResult, reason: EndReason) => void
  resign: (color: Color) => void
  setWarning: (warning: string | null) => void
  toRecord: () => GameRecord | null
  reset: () => void
}

const initialState = {
  gameId: null as string | null,
  chess: null as Game | null,
  startingFen: '',
  fen: '',
  turn: 'w' as Color,
  status: 'idle' as const,
  result: null as GameResult | null,
  endReason: null as EndReason | null,
  moves: [] as MoveResult[],
  storedMoves: [] as StoredMove[],
  selectedSquare: null as Square | null,
  legalMovesFromSelected: [] as Square[],
  lastMove: null as { from: Square; to: Square } | null,
  isCheck: false,
  timeControlBaseSec: 0,
  timeControlIncSec: 0,
  startedAt: 0,
  updatedAt: 0,
  warning: null as string | null,
}

function detectGameEnd(game: Game): { result: GameResult; reason: EndReason } | null {
  const end = game.getGameEndResult()
  return end ? { result: end.result, reason: end.reason } : null
}

export const useLocalGameStore = create<LocalGameStore>((set, get) => ({
  ...initialState,

  startLocalGame: (timeControlBaseSec = 0, timeControlIncSec = 0) => {
    const chess = new Game()
    const state = chess.getState()
    const now = Date.now()
    set({
      ...initialState,
      gameId: crypto.randomUUID(),
      chess,
      startingFen: state.fen,
      fen: state.fen,
      turn: state.turn,
      status: 'active',
      timeControlBaseSec,
      timeControlIncSec,
      startedAt: now,
      updatedAt: now,
    })
  },

  restoreGame: (record) => {
    const chess = replayGame(record)
    if (!chess || record.status !== 'active') return false
    const state = chess.getState()
    const last = record.moves.at(-1)?.result
    set({
      ...initialState,
      gameId: record.id,
      chess,
      startingFen: record.startingFen,
      fen: record.currentFen,
      turn: state.turn,
      status: 'active',
      moves: record.moves.map((move) => move.result),
      storedMoves: record.moves,
      lastMove: last ? { from: last.from, to: last.to } : null,
      isCheck: state.isCheck,
      timeControlBaseSec: record.timeControlBaseSec,
      timeControlIncSec: record.timeControlIncSec,
      startedAt: record.startedAt,
      updatedAt: record.updatedAt,
      warning: record.warning ?? null,
    })
    return true
  },

  selectSquare: (square) => {
    const { chess, selectedSquare, status } = get()
    if (!chess || status !== 'active') return

    if (selectedSquare === square) {
      set({ selectedSquare: null, legalMovesFromSelected: [] })
      return
    }
    if (selectedSquare) {
      const moved = get().submitMove(selectedSquare, square)
      if (!moved) {
        const piece = chess.getPiece(square)
        const turn = chess.getState().turn
        if (piece && piece.color === turn) {
          set({ selectedSquare: square, legalMovesFromSelected: chess.getLegalMovesFrom(square) })
        } else {
          set({ selectedSquare: null, legalMovesFromSelected: [] })
        }
      }
      return
    }

    const piece = chess.getPiece(square)
    const turn = chess.getState().turn
    if (piece && piece.color === turn) {
      set({ selectedSquare: square, legalMovesFromSelected: chess.getLegalMovesFrom(square) })
    }
  },

  submitMove: (from, to, promotion) => {
    const { chess, status } = get()
    if (!chess || status !== 'active') return false
    const moveResult = chess.move(from, to, promotion)
    if (!moveResult) return false

    const state = chess.getState()
    const end = detectGameEnd(chess)
    const now = Date.now()
    set((current) => ({
      fen: state.fen,
      turn: state.turn,
      moves: [...current.moves, moveResult],
      storedMoves: [...current.storedMoves, { from, to, promotion, result: moveResult }],
      lastMove: { from: moveResult.from, to: moveResult.to },
      isCheck: state.isCheck,
      selectedSquare: null,
      legalMovesFromSelected: [],
      updatedAt: now,
    }))
    if (end) get().endGame(end.result, end.reason)
    return true
  },

  endGame: (result, reason) => {
    set({
      status: 'ended',
      result,
      endReason: reason,
      selectedSquare: null,
      legalMovesFromSelected: [],
      updatedAt: Date.now(),
    })
  },

  resign: (color) => get().endGame(color === 'w' ? '0-1' : '1-0', 'resignation'),
  setWarning: (warning) => set({ warning }),

  toRecord: () => {
    const state = get()
    if (!state.gameId || !state.fen || state.status === 'idle') return null
    const completedAt = state.status === 'ended' ? state.updatedAt : null
    return {
      id: state.gameId,
      recordVersion: RECORD_VERSION,
      startingFen: state.startingFen,
      currentFen: state.fen,
      moves: state.storedMoves,
      status: state.status === 'ended' ? 'completed' : 'active',
      result: state.result,
      endReason: state.endReason,
      timeControlBaseSec: state.timeControlBaseSec,
      timeControlIncSec: state.timeControlIncSec,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
      completedAt,
      finalWhiteMs: null,
      finalBlackMs: null,
      warning: state.warning ?? undefined,
    }
  },

  reset: () => set({ ...initialState, chess: null }),
}))
