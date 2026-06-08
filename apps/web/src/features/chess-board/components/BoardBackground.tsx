const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const

interface BoardBackgroundProps {
  size: number
  flipped: boolean
}

export default function BoardBackground({ size, flipped }: BoardBackgroundProps) {
  const sq = size / 8
  const displayRanks = flipped ? [...RANKS].reverse() : RANKS
  const displayFiles = flipped ? [...FILES].reverse() : FILES
  const rank1Index = displayRanks.indexOf('1')
  const fileAIndex = displayFiles.indexOf('a')

  return (
    <div
      className="inline-block border-4 border-board-border rounded-sm ring-1 ring-mando-gold/20"
      style={{ width: size, height: size }}
    >
      <div
        className="relative rounded-sm overflow-hidden"
        style={{ width: size, height: size }}
        role="grid"
        aria-label="Chess board"
      >
        {displayRanks.map((rank, ri) =>
          displayFiles.map((file, fi) => {
            const isLight = (ri + fi) % 2 === 0
            const squareLabel = `${file}${rank}`
            return (
              <div
                key={squareLabel}
                role="gridcell"
                aria-label={squareLabel}
                className={`absolute ${isLight ? 'bg-board-light' : 'bg-board-dark'}`}
                style={{
                  width: sq,
                  height: sq,
                  left: fi * sq,
                  top: ri * sq,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay bg-gradient-to-br from-white/5 to-transparent"
                  aria-hidden
                />
              </div>
            )
          })
        )}
        {displayFiles.map((file, fi) => {
          const isLight = (rank1Index + fi) % 2 === 0
          if (!isLight) return null
          return (
            <span
              key={`file-${file}`}
              className="absolute text-[10px] text-mando-gold/70 font-mono pointer-events-none select-none"
              style={{
                left: fi * sq,
                top: rank1Index * sq,
                width: sq,
                height: sq,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: '2px 3px',
              }}
            >
              {file}
            </span>
          )
        })}
        {displayRanks.map((rank, ri) => (
          <span
            key={`rank-${rank}`}
            className="absolute text-[10px] text-mando-gold/70 font-mono pointer-events-none select-none"
            style={{
              left: fileAIndex * sq,
              top: ri * sq,
              width: sq,
              height: sq,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: '2px 3px',
            }}
          >
            {rank}
          </span>
        ))}
      </div>
    </div>
  )
}
