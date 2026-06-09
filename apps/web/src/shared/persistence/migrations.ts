import { Game } from '@/shared/types'
import { RECORD_VERSION, type GameRecord, type StoredMove } from './schemas'

export function replayGame(record: GameRecord): Game | null {
  if (record.recordVersion !== RECORD_VERSION || !record.id || !record.startingFen) return null

  try {
    const game = new Game(record.startingFen)
    for (const move of record.moves) {
      const applied = game.move(move.from, move.to, move.promotion)
      if (!applied) return null
    }
    return game.toFEN() === record.currentFen ? game : null
  } catch {
    return null
  }
}

export function isStoredMove(value: unknown): value is StoredMove {
  if (!value || typeof value !== 'object') return false
  const move = value as Partial<StoredMove>
  return typeof move.from === 'string' && typeof move.to === 'string' && !!move.result
}

export function isGameRecord(value: unknown): value is GameRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<GameRecord>
  return (
    typeof record.id === 'string' &&
    record.recordVersion === RECORD_VERSION &&
    typeof record.startingFen === 'string' &&
    typeof record.currentFen === 'string' &&
    Array.isArray(record.moves) &&
    record.moves.every(isStoredMove) &&
    (record.status === 'active' || record.status === 'completed') &&
    typeof record.startedAt === 'number' &&
    typeof record.updatedAt === 'number'
  )
}

