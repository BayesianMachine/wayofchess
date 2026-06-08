import { useEffect, useState } from 'react'

export interface GameCardProps {
  game: {
    id: string
    whitePlayer: { username: string } | null
    blackPlayer: { username: string } | null
    timeControl: { label: string; category: string }
    startedAt: string | null
    spectatorCount?: number
    moveCount?: number
  }
  onClick: () => void
}

function formatElapsed(startedAt: string | null): string {
  if (!startedAt) return '—'
  const totalSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${s}s`
}

export default function GameCard({ game, onClick }: GameCardProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(game.startedAt))

  useEffect(() => {
    setElapsed(formatElapsed(game.startedAt))
    if (!game.startedAt) return
    const id = setInterval(() => setElapsed(formatElapsed(game.startedAt)), 1000)
    return () => clearInterval(id)
  }, [game.startedAt])

  const whiteName = game.whitePlayer?.username ?? 'White'
  const blackName = game.blackPlayer?.username ?? 'Black'
  const spectators = game.spectatorCount ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full bg-space-bg border border-mando-gold/20 rounded-lg p-4 cursor-pointer hover:border-mando-gold/50 transition-colors"
    >
      <div className="mb-2">
        <span className="text-mando-silver font-semibold">{whiteName}</span>
        <span className="mx-2 text-mando-silver/40">vs</span>
        <span className="text-imperial-gray font-semibold">{blackName}</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="bg-mando-blue/20 text-mando-blue text-xs px-2 py-0.5 rounded">
          {game.timeControl.label}
        </span>
        <span className="text-mando-silver/60 text-xs">{elapsed}</span>
      </div>

      <p className="text-mando-silver/50 text-xs">
        <span aria-hidden>◉</span> {spectators} watching
        {game.moveCount != null && (
          <span className="ml-2">
            · {game.moveCount} move{game.moveCount === 1 ? '' : 's'}
          </span>
        )}
      </p>
    </button>
  )
}
