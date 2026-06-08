import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { API_URL, thresholds, randomUsername } from './config.js'

const lobbyErrors = new Rate('lobby_errors')
const lobbyDuration = new Trend('lobby_duration_ms', true)

export const options = {
  scenarios: {
    read_lobby: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
    },
  },
  thresholds: {
    ...thresholds,
    lobby_duration_ms: ['p(95)<200'],
  },
}

export function setup() {
  const username = randomUsername()
  const password = 'TestPass123!'
  const email = `${username}@load.test`

  http.post(
    `${API_URL}/auth/register`,
    JSON.stringify({ username, email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  const loginRes = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  const body = JSON.parse(loginRes.body)
  return { token: body.accessToken || '' }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
  }

  const start = Date.now()
  const lobbyRes = http.get(`${API_URL}/games/lobby`, { headers })
  lobbyDuration.add(Date.now() - start)

  const lobbyOk = check(lobbyRes, {
    'lobby status 200': (r) => r.status === 200,
    'lobby is array': (r) => Array.isArray(JSON.parse(r.body)),
  })
  lobbyErrors.add(!lobbyOk)

  sleep(0.5)
}
