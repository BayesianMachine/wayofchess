import type { Color } from '@/shared/types'
import type { ClockRecord, ClockRecovery } from '@/shared/persistence'

export function reconcileClock(clock: ClockRecord, now = Date.now()): ClockRecovery {
  let elapsed = now - clock.checkpointedAt
  let warning: string | null = null

  if (elapsed < -5000) {
    elapsed = 0
    warning = 'The device clock moved backward. No time was added.'
  } else if (elapsed < 0) {
    elapsed = 0
  }

  let whiteMs = clock.whiteMs
  let blackMs = clock.blackMs
  let timedOutColor: Color | null = null
  if (clock.isRunning && clock.activeColor) {
    if (clock.activeColor === 'w') {
      whiteMs = Math.max(0, whiteMs - elapsed)
      if (whiteMs === 0) timedOutColor = 'w'
    } else {
      blackMs = Math.max(0, blackMs - elapsed)
      if (blackMs === 0) timedOutColor = 'b'
    }
  }

  return { whiteMs, blackMs, timedOutColor, warning }
}

