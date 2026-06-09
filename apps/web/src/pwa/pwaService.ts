import { registerSW } from 'virtual:pwa-register'
import { flushPersistenceQueue } from '@/features/local-game/services/gameRepository'
import { checkpointCurrentGame } from '@/features/local-game/services/persistenceService'

export interface PwaState {
  offlineReady: boolean
  updateReady: boolean
  applying: boolean
  error: string | null
}

type Listener = (state: PwaState) => void

let state: PwaState = {
  offlineReady: false,
  updateReady: false,
  applying: false,
  error: null,
}
const listeners = new Set<Listener>()
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null
let registration: ServiceWorkerRegistration | undefined
let initialized = false

function publish(next: Partial<PwaState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener(state))
}

export function getPwaState(): PwaState {
  return state
}

export function subscribeToPwaState(listener: Listener): () => void {
  listeners.add(listener)
  listener(state)
  return () => listeners.delete(listener)
}

export function dismissOfflineReady(): void {
  publish({ offlineReady: false })
}

export function initializePwa(): void {
  if (initialized || !import.meta.env.PROD || !('serviceWorker' in navigator)) return
  initialized = true
  updateServiceWorker = registerSW({
    immediate: true,
    onOfflineReady() {
      publish({ offlineReady: true })
    },
    onNeedRefresh() {
      publish({ updateReady: true })
    },
    onRegisteredSW(_url, nextRegistration) {
      registration = nextRegistration
      window.addEventListener('online', () => void registration?.update())
      window.setInterval(() => void registration?.update(), 60 * 60 * 1000)
    },
    onRegisterError() {
      publish({ error: 'Offline installation could not be completed.' })
    },
  })
}

export async function applyPwaUpdate(): Promise<void> {
  if (!updateServiceWorker || state.applying) return
  publish({ applying: true, error: null })
  try {
    await checkpointCurrentGame()
    await flushPersistenceQueue()
    await updateServiceWorker(true)
  } catch {
    publish({
      applying: false,
      error: 'The update could not be applied. The current version remains available.',
    })
  }
}
