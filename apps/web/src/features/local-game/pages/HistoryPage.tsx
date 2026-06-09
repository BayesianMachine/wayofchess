import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import type { GameRecord } from '@/shared/persistence'
import { clearHistory, deleteCompletedGame, listCompletedGames } from '../services/gameRepository'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<GameRecord[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const refresh = async () => setGames(await listCompletedGames())
  useEffect(() => {
    void refresh()
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-5 py-6">
      <header className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mando-gold">Game History</h1>
          <p className="text-sm text-mando-silver/70">{games.length} completed games</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/')}>Back</Button>
      </header>

      {games.length === 0 ? (
        <p className="border border-mando-gold/20 p-6 text-mando-silver/70">No completed games yet.</p>
      ) : (
        <div className="divide-y divide-mando-gold/20 border border-mando-gold/25">
          {games.map((game) => (
            <article key={game.id} className="flex items-center justify-between gap-4 p-4">
              <button type="button" className="text-left min-w-0" onClick={() => navigate(`/history/${game.id}`)}>
                <div className="font-semibold text-mando-silver">{game.result} · {game.endReason}</div>
                <div className="text-xs text-mando-gold/75">
                  {new Date(game.completedAt ?? game.updatedAt).toLocaleString()} · {game.moves.length} moves
                </div>
              </button>
              {deleteId === game.id ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" onClick={async () => {
                    await deleteCompletedGame(game.id)
                    setDeleteId(null)
                    await refresh()
                  }}>Confirm</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="danger" onClick={() => setDeleteId(game.id)}>Delete</Button>
              )}
            </article>
          ))}
        </div>
      )}

      {games.length > 0 && (
        <div className="mt-6">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-mando-silver">Delete every completed game?</span>
              <Button variant="danger" size="sm" onClick={async () => {
                await clearHistory()
                setConfirmClear(false)
                await refresh()
              }}>Clear All</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>Clear History</Button>
          )}
        </div>
      )}
    </main>
  )
}

