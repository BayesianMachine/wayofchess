import { LOCAL_SETUP_STORAGE_KEY } from '../config/storageKeys'
import type { LocalSetupConfig } from '../types'

const DEFAULT_LOCAL_SETUP: LocalSetupConfig = {
  timeControlBaseSec: 0,
  timeControlIncSec: 0,
}

export function loadLocalSetup(): LocalSetupConfig {
  const raw = localStorage.getItem(LOCAL_SETUP_STORAGE_KEY)
  if (!raw) return DEFAULT_LOCAL_SETUP

  try {
    return JSON.parse(raw) as LocalSetupConfig
  } catch {
    return DEFAULT_LOCAL_SETUP
  }
}

export function saveLocalSetup(config: LocalSetupConfig): void {
  localStorage.setItem(LOCAL_SETUP_STORAGE_KEY, JSON.stringify(config))
}
