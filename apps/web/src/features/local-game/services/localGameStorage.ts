import type { LocalSetupConfig } from '../types'
import { createPreferences, loadPreferences, savePreferences } from './gameRepository'

const DEFAULT_LOCAL_SETUP: LocalSetupConfig = {
  timeControlBaseSec: 0,
  timeControlIncSec: 0,
}

export async function loadLocalSetup(): Promise<LocalSetupConfig> {
  const preferences = await loadPreferences()
  if (!preferences) return DEFAULT_LOCAL_SETUP
  return {
    timeControlBaseSec: preferences.timeControlBaseSec,
    timeControlIncSec: preferences.timeControlIncSec,
  }
}

export async function saveLocalSetup(config: LocalSetupConfig): Promise<void> {
  const existing = await loadPreferences()
  await savePreferences(
    createPreferences(
      config.timeControlBaseSec,
      config.timeControlIncSec,
      existing?.narrativeEnabled ?? true
    )
  )
}
