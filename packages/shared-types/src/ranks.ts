export type Faction = 'mandalorian' | 'imperial'
export type TimeCategory = 'bullet' | 'blitz' | 'rapid' | 'classical'

export interface RankTier {
  minElo: number
  mandalorian: string
  imperial: string
}

export const RANK_TIERS: RankTier[] = [
  { minElo: 0, mandalorian: 'Foundling', imperial: 'Cadet' },
  { minElo: 800, mandalorian: 'Initiate', imperial: 'Stormtrooper' },
  { minElo: 1000, mandalorian: 'Warrior', imperial: 'Sergeant' },
  { minElo: 1200, mandalorian: 'Champion', imperial: 'Officer' },
  { minElo: 1400, mandalorian: 'Veteran', imperial: 'Commander' },
  { minElo: 1600, mandalorian: 'Protector', imperial: 'General' },
  { minElo: 1800, mandalorian: "Mand'alor", imperial: 'Grand Moff' },
]

export const TIME_CONTROLS = [
  { baseSec: 60, incrementSec: 0, category: 'bullet' as TimeCategory, label: 'Bullet 1+0' },
  { baseSec: 120, incrementSec: 1, category: 'bullet' as TimeCategory, label: 'Bullet 2+1' },
  { baseSec: 180, incrementSec: 2, category: 'blitz' as TimeCategory, label: 'Blitz 3+2' },
  { baseSec: 300, incrementSec: 0, category: 'blitz' as TimeCategory, label: 'Blitz 5+0' },
  { baseSec: 300, incrementSec: 3, category: 'blitz' as TimeCategory, label: 'Blitz 5+3' },
  { baseSec: 600, incrementSec: 0, category: 'rapid' as TimeCategory, label: 'Rapid 10+0' },
  { baseSec: 600, incrementSec: 5, category: 'rapid' as TimeCategory, label: 'Rapid 10+5' },
  {
    baseSec: 1800,
    incrementSec: 0,
    category: 'classical' as TimeCategory,
    label: 'Classical 30+0',
  },
  {
    baseSec: 1800,
    incrementSec: 20,
    category: 'classical' as TimeCategory,
    label: 'Classical 30+20',
  },
]

export function getRankTier(elo: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (elo >= RANK_TIERS[i].minElo) return RANK_TIERS[i]
  }
  return RANK_TIERS[0]
}

export function getRankTitle(elo: number, faction: Faction): string {
  const tier = getRankTier(elo)
  return tier[faction]
}

export function getNextRank(
  elo: number,
  faction: Faction,
): { title: string; eloRequired: number } | null {
  const currentTierIndex = RANK_TIERS.findIndex((t) => t.minElo === getRankTier(elo).minElo)
  const nextTier = RANK_TIERS[currentTierIndex + 1]
  if (!nextTier) return null
  return { title: nextTier[faction], eloRequired: nextTier.minElo }
}

export function getRankProgress(elo: number): number {
  const tier = getRankTier(elo)
  const currentIndex = RANK_TIERS.findIndex((t) => t.minElo === tier.minElo)
  const nextTier = RANK_TIERS[currentIndex + 1]
  if (!nextTier) return 1
  const range = nextTier.minElo - tier.minElo
  const progress = elo - tier.minElo
  return Math.min(1, progress / range)
}
