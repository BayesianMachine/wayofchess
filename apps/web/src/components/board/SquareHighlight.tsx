import { motion } from 'framer-motion'
import type { Square } from '@/lib/chessTypes'
import { squareToCoords } from '@/lib/chessTypes'

interface SquareHighlightProps {
  size: number
  flipped: boolean
  selectedSquare: Square | null
  legalSquares: Square[]
  lastMove: { from: Square; to: Square } | null
  checkSquare: Square | null
}

function squarePosition(sq: Square, size: number, flipped: boolean) {
  const sqSize = size / 8
  let { file, rank } = squareToCoords(sq)
  if (flipped) {
    file = 7 - file
    rank = 7 - rank
  }
  return { left: file * sqSize, top: (7 - rank) * sqSize, sqSize }
}

export default function SquareHighlight({
  size,
  flipped,
  selectedSquare,
  legalSquares,
  lastMove,
  checkSquare,
}: SquareHighlightProps) {
  const highlights: Array<{ sq: Square; type: 'selected' | 'legal' | 'last' | 'check' }> = []

  if (selectedSquare) highlights.push({ sq: selectedSquare, type: 'selected' })
  for (const sq of legalSquares) highlights.push({ sq, type: 'legal' })
  if (lastMove) {
    highlights.push({ sq: lastMove.from, type: 'last' })
    highlights.push({ sq: lastMove.to, type: 'last' })
  }
  if (checkSquare) highlights.push({ sq: checkSquare, type: 'check' })

  const bgClass = {
    selected: 'bg-highlight-selected',
    legal: 'bg-highlight-legal',
    last: 'bg-highlight-lastMove',
    check: 'bg-highlight-check',
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: size, height: size }}>
      {highlights.map(({ sq, type }, i) => {
        const { left, top, sqSize } = squarePosition(sq, size, flipped)
        if (type === 'legal') {
          return (
            <div
              key={`${sq}-${type}-${i}`}
              className="absolute flex items-center justify-center"
              style={{ left, top, width: sqSize, height: sqSize }}
            >
              <div className="w-3 h-3 rounded-full bg-highlight-legal" />
            </div>
          )
        }
        if (type === 'last') {
          return (
            <motion.div
              key={`${sq}-${type}-${i}`}
              className={`absolute ${bgClass[type]}`}
              style={{ left, top, width: sqSize, height: sqSize }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )
        }
        return (
          <div
            key={`${sq}-${type}-${i}`}
            className={`absolute ${bgClass[type]}`}
            style={{ left, top, width: sqSize, height: sqSize }}
          />
        )
      })}
    </div>
  )
}
