import { beforeEach, describe, expect, it } from 'vitest'
import { Game } from '@/shared/types'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  RECORD_VERSION,
  SINGLETON_KEY,
  deleteDatabase,
  getDatabase,
  replayGame,
  type BackupFile,
  type ClockRecord,
  type GameRecord,
} from '@/shared/persistence'
import {
  clearAllData,
  clearHistory,
  completeGame,
  createBackup,
  deleteCompletedGame,
  getCompletedGame,
  importBackup,
  listCompletedGames,
  loadActiveGame,
  saveActiveGame,
} from './gameRepository'
import { buildRecordFromLegacy } from './persistenceService'
import { reconcileClock } from './clockRecovery'

function activeRecord(id = 'game-1', updatedAt = 1000): GameRecord {
  const game = new Game()
  const startingFen = game.toFEN()
  const result = game.move('e2', 'e4')!
  return {
    id,
    recordVersion: RECORD_VERSION,
    startingFen,
    currentFen: game.toFEN(),
    moves: [{ from: 'e2', to: 'e4', result }],
    status: 'active',
    result: null,
    endReason: null,
    timeControlBaseSec: 60,
    timeControlIncSec: 0,
    startedAt: 500,
    updatedAt,
    completedAt: null,
    finalWhiteMs: null,
    finalBlackMs: null,
  }
}

function clock(gameId = 'game-1', checkpointedAt = 1000): ClockRecord {
  return {
    key: SINGLETON_KEY,
    gameId,
    recordVersion: RECORD_VERSION,
    whiteMs: 50_000,
    blackMs: 60_000,
    incrementMs: 0,
    activeColor: 'w',
    isRunning: true,
    checkpointedAt,
  }
}

beforeEach(async () => {
  await deleteDatabase().catch(() => undefined)
  await clearAllData()
})

describe('IndexedDB game repository', () => {
  it('creates all stores and restores a replay-valid active game', async () => {
    await saveActiveGame(activeRecord(), clock())
    expect(Array.from((await getDatabase()).objectStoreNames)).toEqual(
      expect.arrayContaining(['activeGame', 'clockState', 'completedGames', 'preferences'])
    )
    expect((await loadActiveGame())?.id).toBe('game-1')
  })

  it('rejects an active record whose replay does not match its FEN', async () => {
    const invalid = { ...activeRecord(), currentFen: new Game().toFEN() }
    expect(replayGame(invalid)).toBeNull()
    await saveActiveGame(invalid)
    expect(await loadActiveGame()).toBeNull()
  })

  it('rejects unsupported record versions', () => {
    expect(replayGame({ ...activeRecord(), recordVersion: 0 })).toBeNull()
  })

  it('atomically archives a completed game and clears recovery state', async () => {
    const completed: GameRecord = {
      ...activeRecord(),
      status: 'completed',
      result: '1-0',
      endReason: 'resignation',
      completedAt: 2000,
      updatedAt: 2000,
    }
    await saveActiveGame(activeRecord(), clock())
    await completeGame(completed, clock())

    expect(await loadActiveGame()).toBeNull()
    expect((await getCompletedGame('game-1'))?.result).toBe('1-0')
    await completeGame(completed, clock())
    expect(await listCompletedGames()).toHaveLength(1)
  })

  it('merges backup history by ID and keeps the newest record', async () => {
    const older = {
      ...activeRecord('history-1', 1000),
      status: 'completed' as const,
      result: '1-0' as const,
      endReason: 'resignation' as const,
      completedAt: 1000,
    }
    await completeGame(older, null)
    const newer = { ...older, result: '0-1' as const, updatedAt: 3000, completedAt: 3000 }
    const backup: BackupFile = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: 4000,
      activeGame: null,
      clock: null,
      completedGames: [newer],
      preferences: null,
    }
    await importBackup(backup)
    expect((await getCompletedGame('history-1'))?.result).toBe('0-1')
  })

  it('orders, deletes, and clears completed history', async () => {
    const older = {
      ...activeRecord('older-game', 1000),
      status: 'completed' as const,
      result: '1-0' as const,
      endReason: 'resignation' as const,
      completedAt: 1000,
    }
    const newer = {
      ...activeRecord('newer-game', 2000),
      status: 'completed' as const,
      result: '0-1' as const,
      endReason: 'resignation' as const,
      completedAt: 2000,
    }
    await completeGame(older, null)
    await completeGame(newer, null)

    expect((await listCompletedGames()).map((game) => game.id)).toEqual([
      'newer-game',
      'older-game',
    ])
    await deleteCompletedGame('newer-game')
    expect((await listCompletedGames()).map((game) => game.id)).toEqual(['older-game'])
    await clearHistory()
    expect(await listCompletedGames()).toEqual([])
  })

  it('round-trips a complete backup', async () => {
    await saveActiveGame(activeRecord(), clock())
    const backup = await createBackup()
    await clearAllData()
    await importBackup(backup)
    expect((await loadActiveGame())?.id).toBe('game-1')
  })

  it('rejects corrupt backup data before changing the database', async () => {
    await saveActiveGame(activeRecord(), clock())
    await expect(importBackup({ format: BACKUP_FORMAT, version: 99 })).rejects.toThrow()
    expect((await loadActiveGame())?.id).toBe('game-1')
  })
})

describe('legacy migration records', () => {
  it('preserves an untimed game and makes a timed legacy game untimed with warning', () => {
    const game = new Game()
    const move = game.move('e2', 'e4')!
    const record = buildRecordFromLegacy(
      { fen: game.toFEN(), moves: [move], status: 'active', mode: 'local' },
      60,
      0,
      1000
    )
    expect(record?.timeControlBaseSec).toBe(0)
    expect(record?.warning).toMatch(/without clocks/)
  })

  it('ignores legacy AI records', () => {
    expect(
      buildRecordFromLegacy(
        { fen: new Game().toFEN(), moves: [], status: 'active', mode: 'ai' },
        0,
        0
      )
    ).toBeNull()
  })
})

describe('clock reconciliation', () => {
  it('deducts elapsed time and detects timeout', () => {
    expect(reconcileClock(clock('game-1', 1000), 6000).whiteMs).toBe(45_000)
    expect(reconcileClock(clock('game-1', 1000), 60_000).timedOutColor).toBe('w')
  })

  it('does not add time after backward clock changes', () => {
    expect(reconcileClock(clock('game-1', 10_000), 8000)).toMatchObject({
      whiteMs: 50_000,
      warning: null,
    })
    expect(reconcileClock(clock('game-1', 10_000), 1000)).toMatchObject({
      whiteMs: 50_000,
      warning: expect.stringMatching(/backward/),
    })
  })
})
