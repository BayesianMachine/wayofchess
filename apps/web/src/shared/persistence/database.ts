import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  type ActiveGameEntry,
  type ClockRecord,
  type GameRecord,
  type PreferencesRecord,
} from './schemas'

interface MandalorianChessDatabase extends DBSchema {
  activeGame: {
    key: string
    value: ActiveGameEntry
  }
  clockState: {
    key: string
    value: ClockRecord
  }
  completedGames: {
    key: string
    value: GameRecord
    indexes: { 'by-completed-at': number }
  }
  preferences: {
    key: string
    value: PreferencesRecord
  }
}

let databasePromise: Promise<IDBPDatabase<MandalorianChessDatabase>> | null = null

export function getDatabase(): Promise<IDBPDatabase<MandalorianChessDatabase>> {
  if (!databasePromise) {
    databasePromise = openDB<MandalorianChessDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('activeGame')) {
          database.createObjectStore('activeGame', { keyPath: 'key' })
        }
        if (!database.objectStoreNames.contains('clockState')) {
          database.createObjectStore('clockState', { keyPath: 'key' })
        }
        if (!database.objectStoreNames.contains('completedGames')) {
          const history = database.createObjectStore('completedGames', { keyPath: 'id' })
          history.createIndex('by-completed-at', 'completedAt')
        }
        if (!database.objectStoreNames.contains('preferences')) {
          database.createObjectStore('preferences', { keyPath: 'key' })
        }
      },
    })
  }
  return databasePromise
}

export async function closeDatabase(): Promise<void> {
  if (!databasePromise) return
  const database = await databasePromise
  database.close()
  databasePromise = null
}

export async function deleteDatabase(): Promise<void> {
  await closeDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Database reset is blocked by another tab.'))
  })
}

export function resetDatabaseConnectionForTests(): void {
  databasePromise = null
}

