import { useEffect, useRef } from 'react'
import type { MoveResult } from '@/shared/types'

export interface MoveListProps {
  moves: MoveResult[]
  maxHeight?: number
  className?: string
}

export default function MoveList({ moves, maxHeight = 400, className = '' }: MoveListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [moves.length])

  const rows: Array<{ num: number; white: string; black?: string }> = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i].san,
      black: moves[i + 1]?.san,
    })
  }

  const lastIndex = moves.length - 1

  return (
    <div
      className={`overflow-y-auto font-mono text-sm text-mando-silver p-3 rounded-lg border border-mando-gold/20 bg-space-bg/60 ${className}`}
      style={maxHeight !== undefined ? { maxHeight } : undefined}
    >
      {rows.length === 0 ? (
        <p className="text-mando-silver/50 italic text-xs">No moves yet</p>
      ) : (
        <div className="space-y-1">
          {rows.map((row, rowIdx) => {
            const whiteMoveIdx = rowIdx * 2
            const blackMoveIdx = whiteMoveIdx + 1
            return (
              <div key={row.num} className="flex gap-2">
                <span className="text-mando-gold/60 w-6 shrink-0">{row.num}.</span>
                <span
                  className={
                    whiteMoveIdx === lastIndex ? 'text-mando-gold font-semibold' : ''
                  }
                >
                  {row.white}
                </span>
                {row.black && (
                  <span
                    className={
                      blackMoveIdx === lastIndex ? 'text-mando-gold font-semibold' : ''
                    }
                  >
                    {row.black}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
