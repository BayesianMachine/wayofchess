import { getRankProgress, getNextRank } from '@/lib/chessTypes'
import type { Faction } from '@/lib/chessTypes'

interface RankProgressBarProps {
  elo: number
  faction: Faction
  showLabel?: boolean
}

export default function RankProgressBar({
  elo,
  faction,
  showLabel = false,
}: RankProgressBarProps) {
  const progress = getRankProgress(elo)
  const nextRank = getNextRank(elo, faction)
  const atMaxRank = progress === 1

  const fillClass = atMaxRank
    ? 'bg-mando-gold'
    : faction === 'mandalorian'
      ? 'bg-mando-blue'
      : 'bg-imperial-red'

  return (
    <div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {showLabel &&
        (atMaxRank ? (
          <p className="text-xs text-mando-gold/70 mt-1">Maximum rank achieved</p>
        ) : nextRank ? (
          <p className="text-xs text-mando-silver/60 mt-1">
            {nextRank.eloRequired - elo} ELO to {nextRank.title}
          </p>
        ) : null)}
    </div>
  )
}
