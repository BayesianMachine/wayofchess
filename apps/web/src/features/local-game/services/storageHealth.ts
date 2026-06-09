export interface StorageHealth {
  available: boolean
  persistent: boolean | null
  usageRatio: number | null
  warning: string | null
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function getStorageHealth(): Promise<StorageHealth> {
  if (!globalThis.indexedDB) {
    return {
      available: false,
      persistent: null,
      usageRatio: null,
      warning: 'Durable storage is unavailable. This game may not survive a restart.',
    }
  }

  let persistent: boolean | null = null
  let usageRatio: number | null = null
  try {
    persistent = navigator.storage?.persisted ? await navigator.storage.persisted() : null
    const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null
    if (estimate?.usage !== undefined && estimate.quota) {
      usageRatio = estimate.usage / estimate.quota
    }
  } catch {
    return {
      available: true,
      persistent,
      usageRatio,
      warning: 'Storage status could not be checked.',
    }
  }

  const warning =
    usageRatio !== null && usageRatio >= 0.8
      ? 'Browser storage is nearly full. Export a backup soon.'
      : persistent === false
        ? 'Chrome may clear local game data under storage pressure. Export backups regularly.'
        : null
  return { available: true, persistent, usageRatio, warning }
}

