import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { API_URL, thresholds, randomUsername, randomPassword } from './config.js'

const registerErrors = new Rate('register_errors')
const loginErrors = new Rate('login_errors')
const loginDuration = new Trend('login_duration_ms', true)

export const options = {
  scenarios: {
    register_and_login: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    ...thresholds,
    login_duration_ms: ['p(95)<300'],
  },
}

export default function () {
  const username = randomUsername()
  const password = randomPassword()
  const email = `${username}@test.mandalorian-chess.com`

  const regRes = http.post(
    `${API_URL}/auth/register`,
    JSON.stringify({ username, email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  const regOk = check(regRes, {
    'register status 201': (r) => r.status === 201,
    'register has user': (r) => JSON.parse(r.body).user != null,
  })
  registerErrors.add(!regOk)

  if (!regOk) {
    sleep(1)
    return
  }

  sleep(0.5)

  const start = Date.now()
  const loginRes = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  )
  loginDuration.add(Date.now() - start)

  const loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has accessToken': (r) => JSON.parse(r.body).accessToken != null,
  })
  loginErrors.add(!loginOk)

  sleep(1)
}
