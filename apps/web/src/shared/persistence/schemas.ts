import type {
  Color,
  EndReason,
  GameResult,
  MoveResult,
  PromotionPiece,
  Square,
} from '@/shared/types'

export const DATABASE_NAME = 'mandalorian-chess'
export const DATABASE_VERSION = 1
export const RECORD_VERSION = 1
export const BACKUP_FORMAT = 'mandalorian-chess-backup'
export const BACKUP_VERSION = 1
export const SINGLETON_KEY = 'current'

export interface StoredMove {
  from: Square
  to: Square
  promotion?: PromotionPiece
  result: MoveResult
}

export interface GameRecord {
  id: string
  recordVersion: number
  startingFen: string
  currentFen: string
  moves: StoredMove[]
  status: 'active' | 'completed'
  result: GameResult | null
  endReason: EndReason | null
  timeControlBaseSec: number
  timeControlIncSec: number
  startedAt: number
  updatedAt: number
  completedAt: number | null
  finalWhiteMs: number | null
  finalBlackMs: number | null
  warning?: string
}

export interface ActiveGameEntry {
  key: typeof SINGLETON_KEY
  value: GameRecord
}

export interface ClockRecord {
  key: typeof SINGLETON_KEY
  gameId: string
  recordVersion: number
  whiteMs: number
  blackMs: number
  incrementMs: number
  activeColor: Color | null
  isRunning: boolean
  checkpointedAt: number
}

export interface PreferencesRecord {
  key: typeof SINGLETON_KEY
  recordVersion: number
  timeControlBaseSec: number
  timeControlIncSec: number
  narrativeEnabled: boolean
  updatedAt: number
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: number
  activeGame: GameRecord | null
  clock: ClockRecord | null
  completedGames: GameRecord[]
  preferences: PreferencesRecord | null
}

export interface ClockRecovery {
  whiteMs: number
  blackMs: number
  timedOutColor: Color | null
  warning: string | null
}

