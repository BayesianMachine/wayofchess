# Mandalorian Chess

A Mandalorian-themed chess game with local play, AI opponents, and real-time online multiplayer.

## Features

- ♟ Full chess rules (FIDE-compliant) via chess.js
- ⚔ Two factions: Mandalorian Covert vs. Imperial Remnant
- 🤖 AI opponents (4 difficulty levels)
- 🌐 Real-time online multiplayer with ELO ratings
- 📺 Live spectating
- 🎭 Narrative commentary system
- 📱 Responsive design with mobile support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Framer Motion |
| State | Zustand |
| Backend | Node.js 20, Fastify, Socket.IO |
| Database | PostgreSQL (Prisma ORM) |
| Cache / Pub-Sub | Redis (ioredis) |
| Monorepo | pnpm workspaces + Turborepo |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

### Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database/redis credentials

# Run database migrations
cd apps/api && npx prisma migrate dev && cd ../..

# Start the frontend only (local and AI play)
pnpm dev
```

The web app runs at http://127.0.0.1:5173. A second Vite instance will fail
instead of selecting another listener.

For accounts, matchmaking, online games, ratings, and spectating, start
PostgreSQL and Redis, then run the complete development stack:

```bash
pnpm dev:full
```

The API runs at http://localhost:3001 when the full stack is configured.

### Using Docker Compose

```bash
docker compose up
```

Access the app at http://localhost:5173.

## Project Structure

```
mandalorian-chess/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Fastify backend
├── packages/
│   ├── chess-engine/ # Chess.js wrapper + analysis
│   └── shared-types/ # Zod schemas + TypeScript types
├── load-tests/       # k6 load tests
└── docs/             # Design and architecture docs
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the frontend only |
| `pnpm dev:web` | Start the frontend only |
| `pnpm dev:full` | Start the frontend and API development processes |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all unit tests |
| `pnpm --filter @mandalorian-chess/web test:e2e` | Run Playwright E2E tests |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

## Troubleshooting Memory

Use [UI_TROUBLESHOOTING.md](./UI_TROUBLESHOOTING.md) for the evidence-first UI
debugging protocol and append-only incident memory.

## License

MIT
