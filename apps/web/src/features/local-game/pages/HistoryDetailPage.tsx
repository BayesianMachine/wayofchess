import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Board, MoveList } from '@/features/chess-board'
import { Button } from '@/shared/ui'
import type { GameRecord } from '@/shared/persistence'
import { getCompletedGame } from '../services/gameRepository'

export default function HistoryDetailPage() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState<GameRecord | null | undefined>(undefined)

  useEffect(() => {
    void getCompletedGame(gameId).then(setGame)
  }, [gameId])

  if (game === undefined) return <p className="p-6 text-mando-silver">Loading history...</p>
  if (!game) return (
    <main className="p-6 text-mando-silver">
      <p>Game not found.</p>
      <Button className="mt-4" onClick={() => navigate('/history')}>Back to History</Button>
    </main>
  )

  const timeControl = game.timeControlBaseSec
    ? `${game.timeControlBaseSec / 60}+${game.timeControlIncSec}`
    : 'No clock'

  return (
    <main className="max-w-6xl mx-auto px-4 py-4">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-mando-gold">{game.result} · {game.endReason}</h1>
          <p className="text-xs text-mando-silver/70">
            {new Date(game.completedAt ?? game.updatedAt).toLocaleString()} · {timeControl}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/history')}>Back</Button>
      </header>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex justify-center">
          <Board
            fen={game.currentFen}
            orientation="w"
            legalMoves={[]}
            lastMove={game.moves.at(-1)?.result
              ? { from: game.moves.at(-1)!.result.from, to: game.moves.at(-1)!.result.to }
              : null}
            onMove={() => {}}
            interactive={false}
          />
        </div>
        <section>
          <h2 className="text-sm font-semibold text-mando-gold mb-2">Moves</h2>
          <MoveList moves={game.moves.map((move) => move.result)} />
          {game.finalWhiteMs !== null && (
            <p className="mt-3 text-xs text-mando-silver/70">
              Final clocks: White {Math.ceil(game.finalWhiteMs / 1000)}s · Black {Math.ceil((game.finalBlackMs ?? 0) / 1000)}s
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

