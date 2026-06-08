import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { API_URL, thresholds, randomUsername, MATCHMAKING_PRESETS } from './config.js'

const joinErrors = new Rate('matchmaking_join_errors')
const joinDuration = new Trend('matchmaking_join_duration_ms', true)

export const options = {
  scenarios: {
    join_matchmaking: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    ...thresholds,
    matchmaking_join_duration_ms: ['p(95)<500'],
  },
}

export function setup() {
  const tokens = []
  for (let i = 0; i < 30; i++) {
    const username = randomUsername()
    const password = 'TestPass123!'
    const email = `${username}@load.test`
    http.post(
      `${API_URL}/auth/register`,
      JSON.stringify({ username, email, password }),
      { headers: { 'Content-Type': 'application/json' } },
    )
    const res = http.post(
      `${API_URL}/auth/login`,
      JSON.stringify({ email, password }),
      { headers: { 'Content-Type': 'application/json' } },
    )
    const body = JSON.parse(res.body)
    if (body.accessToken) tokens.push(body.accessToken)
  }
  return { tokens }
}

export default function (data) {
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)] || ''
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const preset = MATCHMAKING_PRESETS[Math.floor(Math.random() * MATCHMAKING_PRESETS.length)]

  const start = Date.now()
  const res = http.post(
    `${API_URL}/matchmaking/join`,
    JSON.stringify(preset),
    { headers },
  )
  joinDuration.add(Date.now() - start)

  const ok = check(res, {
    'join status 200': (r) => r.status === 200,
    'join queued': (r) => JSON.parse(r.body).queued === true,
  })
  joinErrors.add(!ok)

  sleep(2)

  if (ok) {
    http.post(`${API_URL}/matchmaking/leave`, null, { headers })
  }
}
