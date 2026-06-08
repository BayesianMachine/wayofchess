import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { socketClient } from '@/lib/socketClient'
import { TIME_CONTROLS, type TimeCategory, type TimeControl } from '@/lib/chessTypes'

const CATEGORY_LABELS: Record<TimeCategory, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
}

const CATEGORIES: TimeCategory[] = ['bullet', 'blitz', 'rapid', 'classical']

export default function MatchmakingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, accessToken, isLoading: authLoading } = useAuth()
  const [selectedTc, setSelectedTc] = useState<TimeControl>(TIME_CONTROLS[2])
  const [searching, setSearching] = useState(false)
  const [searchSeconds, setSearchSeconds] = useState(0)
  const [queueSize, setQueueSize] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [challengeLoading, setChallengeLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (!accessToken) return
    socketClient.connect(accessToken)
  }, [accessToken])

  const fetchQueueStatus = useCallback(async () => {
    try {
      const data = await apiClient.get<{ queueSize: number }>(
        `/api/v1/matchmaking/status?category=${selectedTc.category}`,
      )
      setQueueSize(data.queueSize)
    } catch {
      setQueueSize(0)
    }
  }, [selectedTc.category])

  useEffect(() => {
    fetchQueueStatus()
    const id = setInterval(fetchQueueStatus, 5000)
    return () => clearInterval(id)
  }, [fetchQueueStatus])

  useEffect(() => {
    if (!searching) {
      setSearchSeconds(0)
      return
    }
    const id = setInterval(() => setSearchSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [searching])

  useEffect(() => {
    if (!searching) return

    const off = socketClient.on('game:start', (payload) => {
      const { gameId } = payload as { gameId: string }
      setSearching(false)
      navigate(`/play/online/${gameId}`)
    })

    return () => {
      off()
    }
  }, [searching, navigate])

  const handleFindGame = async () => {
    setError(null)
    try {
      await apiClient.post('/api/v1/matchmaking/join', {
        timeControlBaseSec: selectedTc.baseSec,
        timeControlIncSec: selectedTc.incrementSec,
        category: selectedTc.category,
      })
      setSearching(true)
    } catch {
      setError('Failed to join matchmaking queue')
    }
  }

  const handleCancel = async () => {
    try {
      await apiClient.post('/api/v1/matchmaking/leave')
    } catch {
      // ignore
    }
    setSearching(false)
  }

  const handleChallenge = async () => {
    setChallengeLoading(true)
    setError(null)
    try {
      const data = await apiClient.post<{ gameId: string; inviteUrl: string }>(
        '/api/v1/games/challenge',
        {
          timeControlBaseSec: selectedTc.baseSec,
          timeControlIncSec: selectedTc.incrementSec,
          category: selectedTc.category,
        },
      )
      const url = data.inviteUrl.replace(/\/play\/([^/]+)$/, '/play/online/$1')
      setInviteUrl(url)
      setCopied(false)
    } catch {
      setError('Failed to create challenge link')
    } finally {
      setChallengeLoading(false)
    }
  }

  const copyInvite = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy link')
    }
  }

  if (authLoading || !isAuthenticated) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-mando-gold mb-2">Play Online</h1>
      <p className="text-mando-silver/80 mb-8">Find an opponent or challenge a friend.</p>

      {CATEGORIES.map((cat) => {
        const options = TIME_CONTROLS.filter((tc) => tc.category === cat)
        if (options.length === 0) return null
        return (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-semibold text-mando-gold mb-2">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="flex flex-wrap gap-2">
              {options.map((tc) => {
                const isActive = selectedTc.label === tc.label
                return (
                  <button
                    key={tc.label}
                    type="button"
                    disabled={searching}
                    onClick={() => setSelectedTc(tc)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      isActive
                        ? 'active bg-mando-gold/20 border-mando-gold text-mando-gold'
                        : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/50'
                    }`}
                  >
                    {tc.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {error && <p className="text-imperial-red text-sm mb-4">{error}</p>}

      {searching ? (
        <div className="rounded-xl border border-mando-gold/30 bg-space-bg/80 p-8 text-center">
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-mando-gold"
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-mando-gold font-semibold mb-2">Finding your opponent...</p>
          <p className="text-mando-silver text-sm mb-1">
            Searching for {searchSeconds}s
          </p>
          <p className="text-mando-silver/70 text-sm mb-2">{selectedTc.label}</p>
          <p className="text-mando-silver/60 text-sm mb-6">
            ~{queueSize} player{queueSize === 1 ? '' : 's'} searching in{' '}
            {CATEGORY_LABELS[selectedTc.category]}
          </p>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-mando-silver mb-6">
            ~{queueSize} player{queueSize === 1 ? '' : 's'} searching in{' '}
            {CATEGORY_LABELS[selectedTc.category]}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleFindGame}>Find Game</Button>
            <Button variant="secondary" onClick={handleChallenge} disabled={challengeLoading}>
              Challenge a friend
            </Button>
          </div>
        </>
      )}

      <Modal isOpen={!!inviteUrl} onClose={() => setInviteUrl(null)} title="Challenge Link" size="md">
        <p className="text-mando-silver text-sm mb-4">Share this link with your opponent:</p>
        <code className="block text-mando-gold text-sm break-all mb-6 p-3 rounded bg-space-bg border border-mando-gold/20">
          {inviteUrl}
        </code>
        <div className="flex gap-3 items-center">
          <Button onClick={copyInvite}>{copied ? 'Copied!' : 'Copy'}</Button>
          <Button variant="ghost" onClick={() => setInviteUrl(null)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}
