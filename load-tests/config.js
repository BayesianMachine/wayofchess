export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
export const API_URL = `${BASE_URL}/api/v1`

export const thresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.02'],
}

export function randomUsername() {
  return `user_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
}

export function randomPassword() {
  return `Pass_${Math.random().toString(36).slice(2, 12)}!`
}

/** Labels like "5+3" — used for display; matchmaking uses MATCHMAKING_PRESETS */
export const TIME_CONTROLS = ['5+3', '10+0', '3+2', '1+0']

/** API matchmaking join body shapes (timeControlBaseSec, timeControlIncSec, category) */
export const MATCHMAKING_PRESETS = [
  { timeControlBaseSec: 300, timeControlIncSec: 3, category: 'blitz' },
  { timeControlBaseSec: 600, timeControlIncSec: 0, category: 'rapid' },
  { timeControlBaseSec: 180, timeControlIncSec: 2, category: 'blitz' },
  { timeControlBaseSec: 60, timeControlIncSec: 0, category: 'bullet' },
]
