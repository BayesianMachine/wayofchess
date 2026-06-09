import { useEffect, useState } from 'react'
import { useLocalGameStore } from '@/features/local-game'
import {
  applyPwaUpdate,
  dismissOfflineReady,
  getPwaState,
  initializePwa,
  subscribeToPwaState,
} from '@/pwa/pwaService'
import { Button } from '@/shared/ui'

export default function PwaStatus() {
  const [pwa, setPwa] = useState(getPwaState)
  const gameActive = useLocalGameStore((state) => state.status === 'active')

  useEffect(() => {
    initializePwa()
    return subscribeToPwaState(setPwa)
  }, [])

  useEffect(() => {
    if (!pwa.offlineReady) return
    const timer = window.setTimeout(dismissOfflineReady, 5000)
    return () => window.clearTimeout(timer)
  }, [pwa.offlineReady])

  if (!pwa.offlineReady && !pwa.updateReady && !pwa.error) return null

  return (
    <div
      role="status"
      className="fixed bottom-3 left-1/2 z-[10000] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-3 border border-mando-gold/50 bg-space-bg px-4 py-2 text-sm text-mando-silver shadow-lg"
    >
      <span>
        {pwa.error ??
          (pwa.updateReady
            ? gameActive
              ? 'Update available after this game.'
              : 'A new version is ready.'
            : 'Ready for offline play.')}
      </span>
      {pwa.updateReady && !gameActive && !pwa.error && (
        <Button
          size="sm"
          loading={pwa.applying}
          onClick={() => void applyPwaUpdate()}
        >
          Apply Update
        </Button>
      )}
    </div>
  )
}
