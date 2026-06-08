import { useEffect, useState, FormEvent } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RankBadge from '@/components/ui/RankBadge'
import RankProgressBar from '@/components/ui/RankProgressBar'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/apiClient'
import {
  getRankTitle,
  getNextRank,
  type Faction,
  type TimeCategory,
} from '@/lib/chessTypes'
import type { UserProfile } from '@mandalorian-chess/shared-types'

type PublicProfile = UserProfile & {
  totalWins: number
  totalDraws: number
  totalLosses: number
}

interface RecentGame {
  id: string
  whiteUserId: string | null
  blackUserId: string | null
  result: string | null
  category: string
  timeControlBaseSec: number
  timeControlIncSec: number
  endedAt: string | null
  whiteEloDelta: number | null
  blackEloDelta: number | null
  whitePlayer: { id: string; username: string } | null
  blackPlayer: { id: string; username: string } | null
}

const CATEGORY_LABELS: Record<TimeCategory, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
}

function resolveFaction(pref: string): Faction {
  if (pref === 'mandalorian' || pref === 'imperial') return pref
  return 'mandalorian'
}

function timeLabel(baseSec: number, incSec: number): string {
  const baseMin = baseSec / 60
  if (Number.isInteger(baseMin)) return `${baseMin}+${incSec}`
  return `${baseSec}+${incSec}`
}

function resultForUser(
  game: RecentGame,
  userId: string,
): { label: 'W' | 'D' | 'L'; delta: number | null } {
  const isWhite = game.whiteUserId === userId
  const delta = isWhite ? game.whiteEloDelta : game.blackEloDelta
  if (!game.result) return { label: 'D', delta }
  if (game.result === '1/2-1/2') return { label: 'D', delta }
  if (game.result === '1-0') return { label: isWhite ? 'W' : 'L', delta }
  return { label: isWhite ? 'L' : 'W', delta }
}

export default function ProfilePage() {
  const { username: paramUsername } = useParams<{ username: string }>()
  const location = useLocation()
  const authUser = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)

  const isMe = location.pathname === '/profile/me' || paramUsername === 'me'
  const username = isMe ? authUser?.username : paramUsername

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [games, setGames] = useState<RecentGame[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [factionPref, setFactionPref] = useState<'mandalorian' | 'imperial' | 'auto'>('auto')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const [prof, recent] = await Promise.all([
          apiClient.get<PublicProfile>(`/api/v1/users/${username}`),
          apiClient.get<RecentGame[]>(`/api/v1/users/${username}/games`),
        ])
        setProfile(prof)
        setGames(recent)
        if (isMe) {
          setFactionPref(prof.factionPreference)
          setAvatarUrl(prof.avatarUrl ?? '')
        }
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [username, isMe])

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    try {
      const body: { factionPreference?: string; avatarUrl?: string } = {
        factionPreference: factionPref,
      }
      if (avatarUrl.trim()) body.avatarUrl = avatarUrl.trim()
      const updated = await apiClient.patch<{
        id: string
        username: string
        avatarUrl: string | null
        factionPreference: 'mandalorian' | 'imperial' | 'auto'
      }>('/api/v1/users/me', body)
      if (authUser && accessToken) {
        setAuth(
          {
            ...authUser,
            avatarUrl: updated.avatarUrl,
            factionPreference: updated.factionPreference,
          },
          accessToken,
        )
      }
      setProfile((p) =>
        p
          ? {
              ...p,
              avatarUrl: updated.avatarUrl,
              factionPreference: updated.factionPreference,
            }
          : p,
      )
      setEditOpen(false)
    } catch {
      setSaveError('Failed to update profile')
    }
  }

  if (loading) return <LoadingSpinner />

  if (!profile) {
    return (
      <div className="text-center py-16 text-mando-silver">
        User not found.
      </div>
    )
  }

  const totalGames = profile.totalWins + profile.totalDraws + profile.totalLosses
  const winRate =
    totalGames > 0 ? Math.round((profile.totalWins / totalGames) * 100) : 0

  const displayFaction = resolveFaction(profile.factionPreference)
  const profileFaction: Faction =
    profile.factionPreference === 'auto' ? 'mandalorian' : profile.factionPreference
  const primaryRating = profile.ratings[0]?.rating ?? 1200
  const highestElo =
    profile.ratings.length > 0
      ? Math.max(...profile.ratings.map((r) => r.rating))
      : primaryRating

  const bestRatingEntry = profile.ratings.reduce<(typeof profile.ratings)[number] | null>(
    (best, r) => (!best || r.rating > best.rating ? r : best),
    null,
  )
  const bestCategoryNext = bestRatingEntry
    ? getNextRank(bestRatingEntry.rating, profileFaction)
    : null
  const nextRankCallout =
    bestRatingEntry && bestCategoryNext
      ? `${bestCategoryNext.eloRequired - bestRatingEntry.rating} more ELO in ${CATEGORY_LABELS[bestRatingEntry.category as TimeCategory]} to reach ${bestCategoryNext.title}`
      : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-mando-gold">{profile.username}</h1>
          <p className="text-mando-silver/80 mt-1">
            {getRankTitle(primaryRating, displayFaction)} · Member since{' '}
            {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isMe && (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 rounded-lg border border-mando-gold/20 bg-space-bg/60">
        <div className="text-center">
          <div className="text-2xl font-bold text-mando-gold">{profile.totalWins}</div>
          <div className="text-xs text-mando-silver">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-mando-silver">{profile.totalDraws}</div>
          <div className="text-xs text-mando-silver">Draws</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-imperial-red">{profile.totalLosses}</div>
          <div className="text-xs text-mando-silver">Losses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-mando-gold">{winRate}%</div>
          <div className="text-xs text-mando-silver">Win Rate</div>
        </div>
      </div>

      <section className="mb-8 p-4 rounded-lg border border-mando-gold/20 bg-space-bg/60">
        <h2 className="text-sm text-mando-silver/60 uppercase tracking-wider mb-2">
          Your Rank
        </h2>
        <RankBadge elo={highestElo} faction={profileFaction} size="lg" />
        <div className="mt-3">
          <RankProgressBar elo={highestElo} faction={profileFaction} showLabel />
        </div>
        {nextRankCallout && (
          <p className="text-sm text-mando-silver/70 mt-1">{nextRankCallout}</p>
        )}
      </section>

      <h2 className="text-lg font-semibold text-mando-gold mb-4">Ratings</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {profile.ratings.map((r) => (
          <div
            key={r.category}
            className="p-4 rounded-lg border border-mando-gold/20 bg-space-bg"
          >
            <h3 className="text-mando-gold font-semibold mb-2">
              {CATEGORY_LABELS[r.category as TimeCategory]}
            </h3>
            <p className="text-2xl font-bold text-mando-silver">{r.rating}</p>
            <p className="text-xs text-mando-silver/70 mt-1">{r.gamesPlayed} games</p>
            <p className="text-xs text-mando-silver/50 mt-1">Peak: {r.peakRating}</p>
            <div className="mt-2">
              <RankBadge elo={r.rating} faction={profileFaction} size="sm" />
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-mando-gold mb-4">Recent Games</h2>
      {games.length === 0 ? (
        <p className="text-mando-silver text-sm">No completed games yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-mando-gold/20">
          <table className="w-full text-sm text-mando-silver">
            <thead>
              <tr className="border-b border-mando-gold/20 text-mando-gold text-left">
                <th className="p-3">Result</th>
                <th className="p-3">Opponent</th>
                <th className="p-3">ELO</th>
                <th className="p-3">Time</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const { label, delta } = resultForUser(g, profile.id)
                const isWhite = g.whiteUserId === profile.id
                const opponent = isWhite ? g.blackPlayer : g.whitePlayer
                const resultClass =
                  label === 'W'
                    ? 'text-mando-gold'
                    : label === 'L'
                      ? 'text-imperial-red'
                      : 'text-mando-silver'

                return (
                  <tr key={g.id} className="border-b border-mando-gold/10">
                    <td className={`p-3 font-bold ${resultClass}`}>{label}</td>
                    <td className="p-3">
                      {opponent ? (
                        <Link
                          to={`/profile/${opponent.username}`}
                          className="text-mando-gold hover:underline"
                        >
                          {opponent.username}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">
                      {delta !== null ? (delta >= 0 ? `+${delta}` : delta) : '—'}
                    </td>
                    <td className="p-3">
                      {timeLabel(g.timeControlBaseSec, g.timeControlIncSec)} ({g.category})
                    </td>
                    <td className="p-3">
                      {g.endedAt ? new Date(g.endedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm text-mando-silver mb-1">Faction preference</label>
            <select
              value={factionPref}
              onChange={(e) =>
                setFactionPref(e.target.value as 'mandalorian' | 'imperial' | 'auto')
              }
              className="w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver"
            >
              <option value="auto">Auto</option>
              <option value="mandalorian">Mandalorian</option>
              <option value="imperial">Imperial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-mando-silver mb-1">Avatar URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver"
            />
          </div>
          {saveError && <p className="text-imperial-red text-sm">{saveError}</p>}
          <div className="flex gap-3">
            <Button type="submit">Save</Button>
            <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
