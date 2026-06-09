import {
  LOCAL_SETUP_STORAGE_KEY,
  NARRATIVE_ENABLED_STORAGE_KEY,
} from '../config/storageKeys'
import {
  createPreferences,
  loadActiveGame,
  loadPreferences,
  saveActiveGame,
  savePreferences,
} from './gameRepository'
import { buildRecordFromLegacy } from './persistenceService'

const LEGACY_GAME_KEY = 'mando-chess-game'

interface LegacySetup {
  timeControlBaseSec?: number
  timeControlIncSec?: number
}

export async function migrateLegacyStorage(): Promise<string | null> {
  if (typeof localStorage === 'undefined') return null

  const existingPreferences = await loadPreferences()
  let setup: LegacySetup = {}
  try {
    setup = JSON.parse(localStorage.getItem(LOCAL_SETUP_STORAGE_KEY) ?? '{}') as LegacySetup
  } catch {
    setup = {}
  }

  if (!existingPreferences) {
    await savePreferences(
      createPreferences(
        Number(setup.timeControlBaseSec) || 0,
        Number(setup.timeControlIncSec) || 0,
        localStorage.getItem(NARRATIVE_ENABLED_STORAGE_KEY) !== 'false'
      )
    )
  }

  let warning: string | null = null
  if (!(await loadActiveGame())) {
    try {
      const parsed = JSON.parse(localStorage.getItem(LEGACY_GAME_KEY) ?? 'null') as
        | { state?: unknown }
        | null
      const legacy = (parsed?.state ?? parsed) as Parameters<typeof buildRecordFromLegacy>[0] | null
      if (legacy) {
        const record = buildRecordFromLegacy(
          legacy,
          Number(setup.timeControlBaseSec) || 0,
          Number(setup.timeControlIncSec) || 0
        )
        if (record) {
          await saveActiveGame(record)
          warning = record.warning ?? null
        }
      }
    } catch {
      warning = 'An old saved game could not be migrated and was ignored.'
    }
  }

  localStorage.removeItem(LEGACY_GAME_KEY)
  localStorage.removeItem(LOCAL_SETUP_STORAGE_KEY)
  localStorage.removeItem(NARRATIVE_ENABLED_STORAGE_KEY)
  return warning
}

