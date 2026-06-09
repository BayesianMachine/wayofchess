import { getDatabase } from '@/shared/persistence'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  RECORD_VERSION,
  SINGLETON_KEY,
  type BackupFile,
  type ClockRecord,
  type GameRecord,
  type PreferencesRecord,
} from '@/shared/persistence'
import { isGameRecord, replayGame } from '@/shared/persistence'

let writeQueue = Promise.resolve()

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation)
  writeQueue = result.then(() => undefined, () => undefined)
  return result
}

export async function loadActiveGame(): Promise<GameRecord | null> {
  const database = await getDatabase()
  const entry = await database.get('activeGame', SINGLETON_KEY)
  if (!entry || !replayGame(entry.value)) return null
  return entry.value
}

export async function loadClock(): Promise<ClockRecord | null> {
  const database = await getDatabase()
  return (await database.get('clockState', SINGLETON_KEY)) ?? null
}

export async function saveActiveGame(
  game: GameRecord,
  clock?: ClockRecord | null
): Promise<void> {
  return enqueueWrite(async () => {
    const database = await getDatabase()
    const transaction = database.transaction(['activeGame', 'clockState'], 'readwrite')
    await transaction.objectStore('activeGame').put({ key: SINGLETON_KEY, value: game })
    if (clock) await transaction.objectStore('clockState').put(clock)
    await transaction.done
  })
}

export async function saveClock(clock: ClockRecord): Promise<void> {
  return enqueueWrite(async () => {
    const database = await getDatabase()
    await database.put('clockState', clock)
  })
}

export async function discardActiveGame(): Promise<void> {
  return enqueueWrite(async () => {
    const database = await getDatabase()
    const transaction = database.transaction(['activeGame', 'clockState'], 'readwrite')
    await transaction.objectStore('activeGame').delete(SINGLETON_KEY)
    await transaction.objectStore('clockState').delete(SINGLETON_KEY)
    await transaction.done
  })
}

export async function completeGame(
  game: GameRecord,
  clock: ClockRecord | null
): Promise<void> {
  return enqueueWrite(async () => {
    const completed: GameRecord = {
      ...game,
      status: 'completed',
      updatedAt: game.completedAt ?? Date.now(),
      finalWhiteMs: clock?.whiteMs ?? game.finalWhiteMs,
      finalBlackMs: clock?.blackMs ?? game.finalBlackMs,
    }
    const database = await getDatabase()
    const transaction = database.transaction(
      ['activeGame', 'clockState', 'completedGames'],
      'readwrite'
    )
    await transaction.objectStore('completedGames').put(completed)
    await transaction.objectStore('activeGame').delete(SINGLETON_KEY)
    await transaction.objectStore('clockState').delete(SINGLETON_KEY)
    await transaction.done
  })
}

export async function listCompletedGames(): Promise<GameRecord[]> {
  const database = await getDatabase()
  const records = await database.getAll('completedGames')
  return records.sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt))
}

export async function getCompletedGame(id: string): Promise<GameRecord | null> {
  const database = await getDatabase()
  return (await database.get('completedGames', id)) ?? null
}

export async function deleteCompletedGame(id: string): Promise<void> {
  return enqueueWrite(async () => {
    const database = await getDatabase()
    await database.delete('completedGames', id)
  })
}

export async function clearHistory(): Promise<void> {
  return enqueueWrite(async () => {
    const database = await getDatabase()
    await database.clear('completedGames')
  })
}

export async function loadPreferences(): Promise<PreferencesRecord | null> {
  const database = await getDatabase()
  return (await database.get('preferences', SINGLETON_KEY)) ?? null
}

export async function savePreferences(preferences: PreferencesRecord): Promise<void> {
  return enqueueWrite(async () => {
    const database = await getDatabase()
    await database.put('preferences', preferences)
  })
}

export async function clearAllData(): Promise<void> {
  return enqueueWrite(async () => {
    const database = await getDatabase()
    const transaction = database.transaction(
      ['activeGame', 'clockState', 'completedGames', 'preferences'],
      'readwrite'
    )
    await Promise.all([
      transaction.objectStore('activeGame').clear(),
      transaction.objectStore('clockState').clear(),
      transaction.objectStore('completedGames').clear(),
      transaction.objectStore('preferences').clear(),
    ])
    await transaction.done
  })
}

export async function createBackup(): Promise<BackupFile> {
  const database = await getDatabase()
  const [activeEntry, clock, completedGames, preferences] = await Promise.all([
    database.get('activeGame', SINGLETON_KEY),
    database.get('clockState', SINGLETON_KEY),
    database.getAll('completedGames'),
    database.get('preferences', SINGLETON_KEY),
  ])
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    activeGame: activeEntry?.value ?? null,
    clock: clock ?? null,
    completedGames,
    preferences: preferences ?? null,
  }
}

function isBackup(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false
  const backup = value as Partial<BackupFile>
  const validClock =
    !backup.clock ||
    (backup.clock.recordVersion === RECORD_VERSION &&
      typeof backup.clock.gameId === 'string' &&
      typeof backup.clock.whiteMs === 'number' &&
      typeof backup.clock.blackMs === 'number' &&
      typeof backup.clock.checkpointedAt === 'number')
  const validPreferences =
    !backup.preferences ||
    (backup.preferences.recordVersion === RECORD_VERSION &&
      typeof backup.preferences.timeControlBaseSec === 'number' &&
      typeof backup.preferences.timeControlIncSec === 'number' &&
      typeof backup.preferences.narrativeEnabled === 'boolean' &&
      typeof backup.preferences.updatedAt === 'number')
  return (
    backup.format === BACKUP_FORMAT &&
    backup.version === BACKUP_VERSION &&
    typeof backup.exportedAt === 'number' &&
    Array.isArray(backup.completedGames) &&
    backup.completedGames.every((game) => isGameRecord(game) && !!replayGame(game)) &&
    (!backup.activeGame ||
      (isGameRecord(backup.activeGame) && !!replayGame(backup.activeGame))) &&
    validClock &&
    validPreferences
  )
}

export async function importBackup(value: unknown): Promise<void> {
  if (!isBackup(value)) throw new Error('This backup is corrupt or unsupported.')

  return enqueueWrite(async () => {
    const database = await getDatabase()
    const transaction = database.transaction(
      ['activeGame', 'clockState', 'completedGames', 'preferences'],
      'readwrite'
    )
    const activeStore = transaction.objectStore('activeGame')
    const clockStore = transaction.objectStore('clockState')
    const historyStore = transaction.objectStore('completedGames')
    const preferencesStore = transaction.objectStore('preferences')

    for (const incoming of value.completedGames) {
      const existing = await historyStore.get(incoming.id)
      if (!existing || incoming.updatedAt > existing.updatedAt) await historyStore.put(incoming)
    }

    const existingActive = await activeStore.get(SINGLETON_KEY)
    const completedSameId = value.activeGame
      ? await historyStore.get(value.activeGame.id)
      : null
    if (
      value.activeGame &&
      !completedSameId &&
      (!existingActive || value.activeGame.updatedAt > existingActive.value.updatedAt)
    ) {
      await activeStore.put({ key: SINGLETON_KEY, value: value.activeGame })
      if (value.clock?.gameId === value.activeGame.id) await clockStore.put(value.clock)
      else await clockStore.delete(SINGLETON_KEY)
    }

    if (value.preferences) {
      const existingPreferences = await preferencesStore.get(SINGLETON_KEY)
      if (!existingPreferences || value.preferences.updatedAt > existingPreferences.updatedAt) {
        await preferencesStore.put(value.preferences)
      }
    }

    for (const completed of value.completedGames) {
      const active = await activeStore.get(SINGLETON_KEY)
      if (active?.value.id === completed.id) {
        await activeStore.delete(SINGLETON_KEY)
        await clockStore.delete(SINGLETON_KEY)
      }
    }

    await transaction.done
  })
}

export function createPreferences(
  timeControlBaseSec: number,
  timeControlIncSec: number,
  narrativeEnabled: boolean,
  updatedAt = Date.now()
): PreferencesRecord {
  return {
    key: SINGLETON_KEY,
    recordVersion: RECORD_VERSION,
    timeControlBaseSec,
    timeControlIncSec,
    narrativeEnabled,
    updatedAt,
  }
}
