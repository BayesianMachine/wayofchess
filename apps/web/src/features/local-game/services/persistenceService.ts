import { Game, type Color, type MoveResult } from '@/shared/types'
import {
  RECORD_VERSION,
  SINGLETON_KEY,
  type ClockRecord,
  type GameRecord,
} from '@/shared/persistence'
import { useClockStore } from '../state/clockStore'
import { useLocalGameStore } from '../state/localGameStore'
import { completeGame, saveActiveGame, saveClock } from './gameRepository'

export function currentClockRecord(checkpointedAt = Date.now()): ClockRecord | null {
  const gameId = useLocalGameStore.getState().gameId
  if (!gameId) return null
  const clock = useClockStore.getState().snapshot()
  return {
    key: SINGLETON_KEY,
    gameId,
    recordVersion: RECORD_VERSION,
    ...clock,
    checkpointedAt,
  }
}

export async function checkpointCurrentGame(): Promise<void> {
  const game = useLocalGameStore.getState().toRecord()
  if (!game || game.status !== 'active') return
  await saveActiveGame(game, currentClockRecord())
}

export async function checkpointCurrentClock(): Promise<void> {
  const clock = currentClockRecord()
  if (clock) await saveClock(clock)
}

export async function archiveCurrentGame(): Promise<void> {
  const game = useLocalGameStore.getState().toRecord()
  if (!game || game.status !== 'completed') return
  await completeGame(game, currentClockRecord())
}

export function buildRecordFromLegacy(
  legacy: {
    fen: string
    moves?: MoveResult[]
    mode?: 'local' | 'ai' | null
    status?: string
  },
  timeControlBaseSec: number,
  timeControlIncSec: number,
  now = Date.now()
): GameRecord | null {
  if (legacy.mode === 'ai' || legacy.status !== 'active' || !legacy.fen) return null
  const startingFen = new Game().toFEN()
  const game = new Game(startingFen)
  const storedMoves = []
  for (const result of legacy.moves ?? []) {
    const replayed = game.move(result.from, result.to, result.promotion)
    if (!replayed) return null
    storedMoves.push({
      from: result.from,
      to: result.to,
      promotion: result.promotion,
      result: replayed,
    })
  }
  if (game.toFEN() !== legacy.fen) return null
  const warning =
    timeControlBaseSec > 0
      ? 'This legacy timed game was restored without clocks because remaining time was not saved.'
      : undefined
  return {
    id: crypto.randomUUID(),
    recordVersion: RECORD_VERSION,
    startingFen,
    currentFen: legacy.fen,
    moves: storedMoves,
    status: 'active',
    result: null,
    endReason: null,
    timeControlBaseSec: warning ? 0 : timeControlBaseSec,
    timeControlIncSec: warning ? 0 : timeControlIncSec,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    finalWhiteMs: null,
    finalBlackMs: null,
    warning,
  }
}

export function timeoutResult(color: Color): '1-0' | '0-1' {
  return color === 'w' ? '0-1' : '1-0'
}

