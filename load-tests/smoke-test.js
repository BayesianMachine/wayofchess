import http from 'k6/http'
import { check } from 'k6'
import { API_URL, BASE_URL } from './config.js'

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1.0'],
  },
}

export default function () {
  const health = http.get(`${BASE_URL}/health`)
  check(health, { 'health check 200': (r) => r.status === 200 })

  const lobby = http.get(`${API_URL}/games/lobby`)
  check(lobby, { 'lobby reachable': (r) => r.status === 200 })
}
