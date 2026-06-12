# Mandalorian Chess

A responsive, local pass-and-play chess game with Mandalorian and Imperial
character pieces. The current product runs entirely in the browser and requires
no account, API, database, Docker, or network service.

**Installable app:** <https://bayesianmachine.github.io/wayofchess/>

**Release state:** all implementation is integrated into `main`; automated
desktop, tablet-viewport, persistence, offline, and update verification passes.
Physical Android installation and airplane-mode evidence remain the final gate.

## Features

- Full chess rules through the shared chess engine
- Two-player pass-and-play on one device
- Mandalorian and Imperial character artwork
- Time controls, clocks, move history, draw, resignation, and game-over flows
- Tap-to-select and tap-to-move controls for phones and tablets
- Local game recovery using browser storage
- Installable Android Chrome PWA with complete offline gameplay
- Versioned history backup/import and update-safe IndexedDB persistence

## Prerequisites

- Node.js 20 or newer
- pnpm 9

## Development

```bash
pnpm install
pnpm dev
```

The app runs at <http://127.0.0.1:5173>. Vite uses a strict port, so starting a
second copy fails clearly instead of creating a duplicate listener.

Docker, PostgreSQL, Redis, environment files, and backend services are not
required.

To stop an existing Windows development process, identify the listener and stop
its owning process:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen
Stop-Process -Id <OwningProcess>
```

## Project Structure

```text
apps/
  web/                  React, TypeScript, Vite, and Playwright
packages/
  chess-engine/         Framework-independent chess rules
docs/
  local-only-design/    Architecture and implementation checkpoints
```

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start one local Vite frontend |
| `pnpm lint` | Lint retained workspace source |
| `pnpm typecheck` | Type-check the web app and chess engine |
| `pnpm test` | Run workspace unit tests |
| `pnpm test:e2e` | Run local-game browser tests |
| `pnpm test:pwa` | Test offline installation and two-release updates |
| `pnpm build` | Build the chess engine and production web app |
| `pnpm verify:offline` | Verify manifest, precache, assets, and network independence |

Production web output is written to `apps/web/dist`.

## Android Installation

1. Open <https://bayesianmachine.github.io/wayofchess/> in Google Chrome while online.
2. Wait for **Ready for offline play**.
3. Open Chrome's menu and choose **Add to Home screen** or **Install app**.
4. Launch **The Way of Chess** from the home screen in either portrait or landscape.
5. Airplane mode may be enabled after the offline-ready confirmation.

Updates download only while online. If an update is found during a game, it
waits until that game finishes. Export a backup from **Backup & Data** before a
device reset or browser-data cleanup.

See [Android PWA guide](./docs/ANDROID_PWA_GUIDE.md) for installation, updates,
backup, restore, and troubleshooting.

## Documentation

- [Local-only architecture](./docs/local-only-design/ARCHITECTURE_PLAN.md)
- [Implementation checkpoints](./docs/local-only-design/README.md)
- [UI troubleshooting memory](./UI_TROUBLESHOOTING.md)

## License

MIT
