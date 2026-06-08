import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import GameCard from '@/components/ui/GameCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { apiClient } from '@/lib/apiClient'
import type { GameSummary, TimeCategory } from '@mandalorian-chess/shared-types'

const FILTERS: Array<{ key: 'all' | TimeCategory; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'bullet', label: 'Bullet' },
  { key: 'blitz', label: 'Blitz' },
  { key: 'rapid', label: 'Rapid' },
  { key: 'classical', label: 'Classical' },
]

export default function SpectatorLobbyPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | TimeCategory>('all')
  const [allGames, setAllGames] = useState<GameSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLobby = useCallback(async () => {
    try {
      const data = await apiClient.get<GameSummary[]>('/api/v1/games/lobby')
      setAllGames(data)
    } catch {
      setAllGames([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchLobby()
    const id = setInterval(fetchLobby, 10000)
    return () => clearInterval(id)
  }, [fetchLobby])

  const games = useMemo(() => {
    if (filter === 'all') return allGames
    return allGames.filter((g) => g.timeControl.category === filter)
  }, [allGames, filter])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl text-mando-gold font-bold">Live Games</h1>
        <p className="text-mando-silver/60 mt-1">Watch ongoing battles</p>
        <p className="text-sm text-mando-silver/50 mt-2">
          {games.length} game{games.length === 1 ? '' : 's'} in progress
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filter === f.key
                ? 'bg-mando-gold/20 border-mando-gold text-mando-gold'
                : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-mando-silver/80">No live games right now.</p>
          <Button onClick={() => navigate('/play/local')}>Start a Game</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => navigate(`/watch/${game.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
