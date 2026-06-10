import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import type { GameRecord } from '@/shared/persistence'
import { TIME_CONTROLS } from '../config/timeControls'
import { loadLocalSetup, saveLocalSetup } from '../services/localGameStorage'
import { discardActiveGame, loadActiveGame, loadClock } from '../services/gameRepository'
import { migrateLegacyStorage } from '../services/legacyMigration'
import { checkpointCurrentGame, timeoutResult } from '../services/persistenceService'
import { reconcileClock } from '../services/clockRecovery'
import { getStorageHealth, requestPersistentStorage } from '../services/storageHealth'
import { useClockStore } from '../state/clockStore'
import { useLocalGameStore } from '../state/localGameStore'
import type { LocalSetupConfig } from '../types'

export type { LocalSetupConfig } from '../types'

const NO_CLOCK: LocalSetupConfig = { timeControlBaseSec: 0, timeControlIncSec: 0 }

export default function LocalSetupPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<LocalSetupConfig>(NO_CLOCK)
  const [recovery, setRecovery] = useState<GameRecord | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const migrationWarning = await migrateLegacyStorage()
        const [setup, saved, health] = await Promise.all([
          loadLocalSetup(),
          loadActiveGame(),
          getStorageHealth(),
        ])
        setSelected(setup)
        setRecovery(saved)
        setWarning(migrationWarning ?? saved?.warning ?? health.warning)
      } catch {
        setWarning('Durable storage is unavailable. New games can still be played in this tab.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleStart = async () => {
    try {
      await saveLocalSetup(selected)
    } catch {
      setWarning('Preferences could not be saved, but this game can continue in this tab.')
    }
    useLocalGameStore.getState().startLocalGame(
      selected.timeControlBaseSec,
      selected.timeControlIncSec
    )
    if (selected.timeControlBaseSec > 0) {
      useClockStore.getState().init(selected.timeControlBaseSec, selected.timeControlIncSec)
      useClockStore.getState().startFor('w')
    } else {
      useClockStore.getState().reset()
    }
    try {
      await checkpointCurrentGame()
      const persistent = await requestPersistentStorage()
      if (persistent === false) {
        useLocalGameStore
          .getState()
          .setWarning('Chrome may clear local data under storage pressure. Export backups regularly.')
      }
    } catch {
      useLocalGameStore
        .getState()
        .setWarning('This game could not be saved, but play can continue in this tab.')
    }
    navigate('/game')
  }

  const handleResume = async () => {
    if (!recovery || !useLocalGameStore.getState().restoreGame(recovery)) {
      setWarning('The saved game could not be restored.')
      return
    }
    const clock = await loadClock()
    if (clock?.gameId === recovery.id) {
      const reconciled = reconcileClock(clock)
      useClockStore.getState().restore(
        {
          whiteMs: reconciled.whiteMs,
          blackMs: reconciled.blackMs,
          incrementMs: clock.incrementMs,
          activeColor: reconciled.timedOutColor ? null : clock.activeColor,
          isRunning: reconciled.timedOutColor ? false : clock.isRunning,
        },
        !reconciled.timedOutColor
      )
      if (reconciled.warning) useLocalGameStore.getState().setWarning(reconciled.warning)
      if (reconciled.timedOutColor) {
        useLocalGameStore
          .getState()
          .endGame(timeoutResult(reconciled.timedOutColor), 'timeout')
      }
    } else {
      useClockStore.getState().reset()
    }
    await requestPersistentStorage()
    navigate('/game')
  }

  const handleDiscard = async () => {
    await discardActiveGame()
    useLocalGameStore.getState().reset()
    useClockStore.getState().reset()
    setRecovery(null)
  }

  const isNoClock =
    selected.timeControlBaseSec === 0 && selected.timeControlIncSec === 0

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold text-mando-gold mb-2">Pass & Play Setup</h1>
          <p className="text-mando-silver/80">Choose a time control for your local match.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
          History
        </Button>
      </div>

      {warning && (
        <div role="status" className="mb-5 border border-mando-gold/40 bg-mando-gold/10 p-3 text-sm text-mando-silver">
          {warning}
        </div>
      )}

      {loading ? (
        <p className="text-mando-silver">Checking saved games...</p>
      ) : recovery ? (
        <section className="border border-mando-gold/40 bg-space-bg/70 p-5 mb-6">
          <h2 className="text-xl font-semibold text-mando-gold">Unfinished game found</h2>
          <p className="text-sm text-mando-silver/80 mt-2">
            {recovery.moves.length} moves saved · started {new Date(recovery.startedAt).toLocaleString()}
          </p>
          <div className="flex gap-3 mt-5">
            <Button onClick={handleResume}>Resume</Button>
            <Button variant="danger" onClick={handleDiscard}>Discard</Button>
          </div>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {TIME_CONTROLS.map((tc) => {
              const active =
                !isNoClock &&
                selected.timeControlBaseSec === tc.baseSec &&
                selected.timeControlIncSec === tc.incrementSec
              return (
                <button
                  key={tc.label}
                  type="button"
                  onClick={() =>
                    setSelected({
                      timeControlBaseSec: tc.baseSec,
                      timeControlIncSec: tc.incrementSec,
                    })
                  }
                  className={`min-h-11 px-3 py-2 rounded-md text-sm border transition-colors ${
                    active
                      ? 'bg-mando-gold/30 border-mando-gold text-mando-gold'
                      : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/60'
                  }`}
                >
                  {tc.label}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setSelected(NO_CLOCK)}
              className={`min-h-11 px-3 py-2 rounded-md text-sm border transition-colors ${
                isNoClock
                  ? 'bg-mando-gold/30 border-mando-gold text-mando-gold'
                  : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/60'
              }`}
            >
              No Clock
            </button>
          </div>
          <Button size="lg" onClick={handleStart}>Start Game</Button>
        </>
      )}

      <div className="mt-8 border-t border-mando-gold/20 pt-5">
        <Button variant="secondary" size="sm" onClick={() => navigate('/data')}>
          Backup & Data
        </Button>
      </div>
    </main>
  )
}
