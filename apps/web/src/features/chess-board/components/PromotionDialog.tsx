import type { Square, Color, PromotionPiece } from '@/shared/types'
import { squareToCoords } from '@/shared/types'
import PieceComponent from './PieceComponent'

interface PromotionDialogProps {
  square: Square
  color: Color
  onSelect: (piece: PromotionPiece) => void
  onCancel: () => void
  boardSize: number
  flipped: boolean
}

const OPTIONS: PromotionPiece[] = [
  'q',
  'r',
  'b',
  'n',
]

export default function PromotionDialog({
  square,
  color,
  onSelect,
  onCancel,
  boardSize,
  flipped,
}: PromotionDialogProps) {
  const sqSize = boardSize / 8
  let { file, rank } = squareToCoords(square)
  if (flipped) {
    file = 7 - file
    rank = 7 - rank
  }
  const left = file * sqSize
  const top = (7 - rank) * sqSize

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onCancel} aria-hidden />
      <div
        className="absolute z-50 flex gap-1 p-1 rounded-md bg-space-bg border border-mando-gold/50 shadow-xl"
        style={{ left, top, width: sqSize * 4, minHeight: sqSize }}
      >
        {OPTIONS.map((piece) => (
          <button
            key={piece}
            type="button"
            onClick={() => onSelect(piece)}
            className="flex-1 flex items-center justify-center rounded hover:bg-mando-gold/20"
            style={{ height: sqSize }}
            aria-label={`Promote to ${piece}`}
          >
            <PieceComponent piece={{ color, type: piece }} size={sqSize * 0.9} />
          </button>
        ))}
      </div>
    </>
  )
}
