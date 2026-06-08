import { Game, type MoveResult } from '@/lib/chessTypes'

const DEPTH_MAP: Record<string, number> = {
  foundling: 1,
  warrior: 5,
  champion: 10,
  'mand-alor': 20,
}

const TIME_LIMIT_MAP: Record<string, number> = {
  foundling: 500,
  warrior: 1000,
  champion: 2000,
  'mand-alor': 3000,
}

function scoreMove(m: MoveResult): number {
  let score = 0
  if (m.captured) score += 30
  if (m.isCheck) score += 20
  if (m.promotion) score += 50
  return score
}

export class StockfishWorker {
  private worker: Worker | null = null
  private pendingResolve: ((move: string | null) => void) | null = null
  private isReady = false

  async init(): Promise<void> {
    return new Promise((resolve) => {
      // Use the stockfish npm package WASM build
      // In Vite, we use `new Worker(new URL('stockfish/src/stockfish.js', import.meta.url))`
      // For now, create a minimal stub that uses Game legal moves as fallback
      // TODO: Replace with actual Stockfish WASM worker in production
      this.isReady = true
      resolve()
    })
  }

  async getBestMove(fen: string, difficulty: string): Promise<string | null> {
    if (!this.isReady) await this.init()

    const depth = DEPTH_MAP[difficulty] ?? 5
    const timeLimit = TIME_LIMIT_MAP[difficulty] ?? 1000

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const game = new Game(fen)
          const moves = game.getState().legalMoves
          if (moves.length === 0) {
            resolve(null)
            return
          }

          let candidates = moves
          if (depth >= 5) {
            const scored = [...moves].sort((a, b) => scoreMove(b) - scoreMove(a))
            const topScore = scoreMove(scored[0])
            const topTier = scored.filter((m) => scoreMove(m) >= topScore - 10)
            candidates = topTier.slice(0, Math.min(3, topTier.length))
          }

          const move = candidates[Math.floor(Math.random() * candidates.length)]
          resolve(`${move.from}${move.to}${move.promotion ?? ''}`)
        } catch {
          resolve(null)
        }
      }, Math.min(timeLimit, 800))
    })
  }

  destroy() {
    this.worker?.terminate()
    this.worker = null
  }
}

export const stockfishWorker = new StockfishWorker()
