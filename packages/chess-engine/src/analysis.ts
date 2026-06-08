import type { MoveResult, PositionEval } from './types.js'

export type { PositionEval }

export function annotateFromCentipawnLoss(loss: number): PositionEval['annotation'] {
  if (loss === 0) return 'best'
  if (loss < 20) return 'good'
  if (loss < 50) return 'inaccuracy'
  if (loss < 150) return 'mistake'
  return 'blunder'
}

export function buildAnalysis(moves: MoveResult[], evals: number[]): PositionEval[] {
  return moves.map((m, i) => {
    const loss = Math.max(0, evals[i] ?? 0)
    return {
      moveNumber: Math.floor(i / 2) + 1,
      color: i % 2 === 0 ? 'w' : 'b',
      san: m.san,
      centipawnLoss: loss,
      annotation: annotateFromCentipawnLoss(loss),
    }
  })
}
