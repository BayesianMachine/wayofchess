# Load Tests

k6-based load tests for the Mandalorian Chess API.

## Prerequisites

Install k6: https://k6.io/docs/getting-started/installation/

## Running Tests

```bash
# Smoke test (run first)
k6 run load-tests/smoke-test.js

# Auth load test
k6 run load-tests/auth.js

# Game API load test
k6 run load-tests/games.js

# Matchmaking load test
k6 run load-tests/matchmaking.js

# WebSocket load test (Socket.IO — see note below)
k6 run load-tests/websocket.js

# Full suite with staging environment
BASE_URL=https://api.staging.mandalorian-chess.com k6 run load-tests/auth.js
```

Set `BASE_URL` if the API is not on `http://localhost:3000` (default).

## Performance Targets (SLAs)

| Endpoint | p95 Latency | Error Rate |
|----------|------------|------------|
| POST /auth/login | < 300ms | < 1% |
| GET /games/lobby | < 200ms | < 0.5% |
| POST /matchmaking/join | < 500ms | < 1% |
| WebSocket connection | < 1000ms | < 2% |

## Scenarios

- **auth.js**: 50 concurrent users registering + logging in over 2 minutes
- **games.js**: 100 concurrent reads of game lobby and game state
- **matchmaking.js**: 30 concurrent users joining matchmaking queue
- **websocket.js**: 20 concurrent WebSocket connections playing moves

## API notes

- **Login** uses `email` + `password` (not username).
- **Matchmaking join** expects `{ timeControlBaseSec, timeControlIncSec, category }`.
- **Register** is rate-limited (5/min per IP); high VU auth tests may see 429s unless limits are relaxed for load environments.
- **WebSocket**: the API uses Socket.IO on namespace `/game` with JWT in `handshake.auth.token`. The `websocket.js` script is a baseline; full Socket.IO load testing may need [k6 extensions](https://k6.io/docs/javascript-api/k6-experimental/) or a dedicated client.
