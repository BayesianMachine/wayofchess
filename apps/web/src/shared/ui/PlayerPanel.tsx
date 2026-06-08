import type { Faction } from '@/shared/types'

interface PlayerPanelProps {
  username: string
  faction: Faction
  clockMs: number
  isActive: boolean
  isTop: boolean
}

function formatClock(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function clockDisplayClasses(clockMs: number): string {
  const base = 'font-mono text-xl tabular-nums'
  if (clockMs < 10_000) return `${base} text-imperial-red animate-clock-danger`
  if (clockMs < 30_000) return `${base} text-white text-yellow-400`
  return `${base} text-white`
}

export default function PlayerPanel({
  username,
  faction,
  clockMs,
  isActive,
  isTop,
}: PlayerPanelProps) {
  const factionLabel = faction === 'mandalorian' ? 'Mandalorian' : 'Imperial'

  return (
    <div
      className={`flex items-center gap-4 px-4 py-2 rounded-lg border border-mando-gold/20 bg-space-bg/80 ${
        isTop ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      <div className={`flex-1 ${isTop ? 'text-left' : 'text-right'}`}>
        <div className="font-semibold text-mando-silver">{username}</div>
        <div className="text-xs text-mando-gold/80">{factionLabel}</div>
      </div>
      <div
        className={`px-4 py-2 rounded-md bg-imperial-gray/40 ${
          isActive ? 'animate-clock-pulse ring-1 ring-mando-gold/40' : ''
        }`}
      >
        <span className={clockDisplayClasses(clockMs)}>{formatClock(clockMs)}</span>
      </div>
    </div>
  )
}
