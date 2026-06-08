import type { Square } from '@/shared/types'

export interface LegalMovesForSquare {
  from: Square
  legalTargets: Square[]
}
