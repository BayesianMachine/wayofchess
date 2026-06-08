import ws from 'k6/ws'
import { check, sleep } from 'k6'
import { Rate, Counter } from 'k6/metrics'
import { BASE_URL, randomUsername } from './config.js'
import http from 'k6/http'

const wsErrors = new Rate('ws_errors')
const movesSubmitted = new Counter('moves_submitted')

const WS_URL = BASE_URL.replace('http', 'ws')
const API_URL = `${BASE_URL}/api/v1`

export const options = {
  scenarios: {
    websocket_connections: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
    },
  },
  thresholds: {
    ws_errors: ['rate<0.05'],
    ws_connecting_duration: ['p(95)<1000'],
  },
}

export function setup() {
  const tokens = []
  for (let i = 0; i < 20; i++) {
    const u = randomUsername()
    const p = 'TestPass123!'
    const email = `${u}@ws.test`
    http.post(
      `${API_URL}/auth/register`,
      JSON.stringify({ username: u, email, password: p }),
      { headers: { 'Content-Type': 'application/json' } },
    )
    const r = http.post(
      `${API_URL}/auth/login`,
      JSON.stringify({ email, password: p }),
      { headers: { 'Content-Type': 'application/json' } },
    )
    const b = JSON.parse(r.body)
    if (b.accessToken) tokens.push(b.accessToken)
  }
  return { tokens }
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length] || ''
  // Socket.IO engine path; auth is normally handshake.auth.token (see README)
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      check(socket, { 'ws connected': () => true })
    })

    socket.on('message', (msg) => {
      try {
        const data = JSON.parse(msg)
        if (data.event === 'game:start') {
          socket.send(
            JSON.stringify({
              event: 'move:submit',
              data: { gameId: data.data?.gameId, from: 'e2', to: 'e4' },
            }),
          )
          movesSubmitted.add(1)
        }
      } catch (_) {
        /* Socket.IO framing is not plain JSON */
      }
    })

    socket.on('error', () => wsErrors.add(1))
    socket.setTimeout(() => socket.close(), 30_000)
  })

  check(res, { 'ws status 101 or closed OK': (r) => r && r.status === 101 })
  sleep(1)
}
