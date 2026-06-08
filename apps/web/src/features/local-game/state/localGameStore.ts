import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Game,
  type Square,
  type Color,
  type PromotionPiece,
  type MoveResult,
  type GameResult,
  type EndReason,
} from '@/shared/types'

interface PersistedGameState {
  mode?: 'local' | 'ai' | null
  fen: string
  turn: Color
  status: 'idle' | 'active' | 'ended'
  result: GameResult | null
  endReason: EndReason | null
  moves: MoveResult[]
}

interface LocalGameStore {
  chess: Game | null
  fen: string
  turn: Color
  status: 'idle' | 'active' | 'ended'
  result: GameResult | null
  endReason: EndReason | null
  moves: MoveResult[]
  selectedSquare: Square | null
  legalMovesFromSelected: Square[]
  lastMove: { from: Square; to: Square } | null
  isCheck: boolean

  startLocalGame: (timeControlBaseSec?: number, timeControlIncSec?: number) => void
  selectSquare: (square: Square) => void
  submitMove: (from: Square, to: Square, promotion?: PromotionPiece) => boolean
  endGame: (result: GameResult, reason: EndReason) => void
  resign: (color: Color) => void
  reset: () => void
}

const initialState = {
  chess: null as Game | null,
  fen: '',
  turn: 'w' as Color,
  status: 'idle' as const,
  result: null as GameResult | null,
  endReason: null as EndReason | null,
  moves: [] as MoveResult[],
  selectedSquare: null as Square | null,
  legalMovesFromSelected: [] as Square[],
  lastMove: null as { from: Square; to: Square } | null,
  isCheck: false,
}

function detectGameEnd(game: Game): { result: GameResult; reason: EndReason } | null {
  const end = game.getGameEndResult()
  if (!end) return null
  return { result: end.result, reason: end.reason }
}

function applyMoveToState(
  game: Game,
  moveResult: MoveResult,
  set: (partial: Partial<LocalGameStore>) => void,
  get: () => LocalGameStore
) {
  const state = game.getState()
  const end = detectGameEnd(game)

  set({
    fen: state.fen,
    turn: state.turn,
    moves: [...get().moves, moveResult],
    lastMove: { from: moveResult.from, to: moveResult.to },
    isCheck: state.isCheck,
    selectedSquare: null,
    legalMovesFromSelected: [],
  })

  if (end) {
    get().endGame(end.result, end.reason)
  }
}

export const useLocalGameStore = create<LocalGameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startLocalGame: (_timeControlBaseSec?: number, _timeControlIncSec?: number) => {
        const chess = new Game()
        const state = chess.getState()
        set({
          ...initialState,
          chess,
          fen: state.fen,
          turn: state.turn,
          status: 'active',
        })
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
              const legal = chess.getLegalMovesFrom(square)
              set({ selectedSquare: square, legalMovesFromSelected: legal })
            } else {
              set({ selectedSquare: null, legalMovesFromSelected: [] })
            }
          }
          return
        }

        const piece = chess.getPiece(square)
        const turn = chess.getState().turn
        if (piece && piece.color === turn) {
          const legal = chess.getLegalMovesFrom(square)
          set({ selectedSquare: square, legalMovesFromSelected: legal })
        }
      },

      submitMove: (from, to, promotion) => {
        const { chess, status } = get()
        if (!chess || status !== 'active') return false

        const moveResult = chess.move(from, to, promotion)
        if (!moveResult) return false
        applyMoveToState(chess, moveResult, set, get)
        return true
      },

      endGame: (result, reason) => {
        set({
          status: 'ended',
          result,
          endReason: reason,
          selectedSquare: null,
          legalMovesFromSelected: [],
        })
      },

      resign: (color) => {
        const result: GameResult = color === 'w' ? '0-1' : '1-0'
        get().endGame(result, 'resignation')
      },

      reset: () => {
        set({ ...initialState, chess: null })
      },

    }),
    {
      name: 'mando-chess-game',
      partialize: (state): PersistedGameState | Record<string, never> => {
        if (state.status !== 'active') return {}
        return {
          fen: state.fen,
          turn: state.turn,
          status: state.status,
          result: state.result,
          endReason: state.endReason,
          moves: state.moves,
        }
      },
      merge: (persisted, current) => {
        const p = persisted as PersistedGameState | undefined
        if (!p || p.mode === 'ai' || !p.fen || p.status !== 'active') {
          return current
        }
        return {
          ...current,
          ...p,
          chess: null,
          selectedSquare: null,
          legalMovesFromSelected: [],
          lastMove: null,
          isCheck: false,
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.fen && state.status === 'active') {
          state.chess = new Game(state.fen)
        }
      },
    }
  )
)
