# Local-Only Architecture Plan

**Status:** Implemented on `main`; physical Android release verification pending
**Branch:** `main`
**First-iteration scope:** Offline local pass-and-play chess on an Android tablet

## Implementation Outcome

The local-only architecture is implemented and deployed from
`BayesianMachine/wayofchess`. Phases 1 through 6 are integrated into `main`,
with automated release verification complete. The remaining release gate is
physical Android Chrome evidence for installation, standalone landscape launch,
airplane-mode cold start, system-UI clearance, and active-clock recovery.

Production: <https://bayesianmachine.github.io/wayofchess/>

## Goal

Restructure the project around a small, self-contained local chess application.
After a one-time online installation, the first iteration should run completely
offline on an Android tablet and must not require login, an API server,
WebSockets, PostgreSQL, Redis, Docker, or Kubernetes. Internet access is needed
only for initial installation and user-initiated updates.

The supported tablet delivery method will be an installable Progressive Web App
(PWA) served from a stable HTTPS origin. The recipient opens an emailed link in
Google Chrome, installs the application once while online, and can then launch
and play it without an internet connection.

The PWA must cache its complete application shell and assets during installation.
IndexedDB remains attached to the stable HTTPS origin, so application updates do
not create a separate game-history database.

Multiplayer and authentication code will be separated from the local game before
it is removed from this branch. The existing `main` branch and Git history remain
the source for restoring those capabilities later.

## Scope

### Included

- Local two-player setup and gameplay
- Chess rules and move validation
- Board and Mandalorian piece presentation
- Player clocks and time controls
- Move history, resignation, draw, promotion, and game-over states
- Local narrative text
- Browser-local preferences and game state where useful
- Automatic game recovery using IndexedDB
- Fully bundled fonts, Mandalorian pieces, styles, scripts, and other assets
- Installable PWA manifest and offline service worker
- Landscape-first touch controls for an Android tablet
- Focused unit, integration, and browser tests
- A self-contained offline production artifact

### Deferred

- Accounts, login, registration, profiles, and ratings
- Matchmaking and online games
- Spectating and live-game listings
- Socket.IO and REST API clients
- Node API, PostgreSQL, Prisma, and Redis
- Docker Compose and Kubernetes deployment
- Computer/Stockfish play

AI is deferred because "local-only" is being interpreted as pass-and-play only.
It can return later as an independent `computer-game` feature without bringing
back accounts or server infrastructure.

## Design Principles

1. **Local play owns its workflow.** Setup, clocks, game state, and game-over
   behavior live together instead of being spread across general-purpose stores.
2. **The chess engine stays framework-independent.** Legal moves and game rules
   remain in `packages/chess-engine`.
3. **Presentation is reusable, not network-aware.** Board and common UI
   components receive data and callbacks through props.
4. **No inactive platform code in the local build.** Auth and multiplayer modules
   should not merely be hidden behind routes or feature flags.
5. **The browser is the runtime.** The app should start with one Vite process and
   deploy as static files from a stable HTTPS origin.
6. **Future features have clear boundaries.** Online or AI play can later be
   introduced as separate features that depend on the chess domain and shared UI.
7. **Offline is a build invariant.** Production code must not depend on remote
   fonts, CDNs, analytics, APIs, or runtime asset downloads.
8. **Persistence is versioned application data.** IndexedDB schemas and saved
   game formats require explicit versions and migrations.
9. **Updates are atomic.** A new service worker must not activate midway through
   a game or leave the cached application shell on mixed release versions.

## Proposed Structure

```text
mandalorian-chess/
|-- apps/
|   `-- web/
|       |-- public/
|       |   |-- icons/
|       |   |-- manifest.webmanifest
|       |   `-- pieces/
|       |-- src/
|       |   |-- app/
|       |   |   |-- App.tsx
|       |   |   |-- pwa.ts
|       |   |   |-- routes.tsx
|       |   |   `-- service-worker.ts
|       |   |-- main.tsx
|       |   |-- features/
|       |   |   |-- chess-board/
|       |   |   |   |-- components/
|       |   |   |   |   |-- Board.tsx
|       |   |   |   |   |-- MoveList.tsx
|       |   |   |   |   |-- PlayerPanel.tsx
|       |   |   |   |   `-- PromotionDialog.tsx
|       |   |   |   |-- model/
|       |   |   |   |   `-- boardTypes.ts
|       |   |   |   `-- index.ts
|       |   |   `-- local-game/
|       |   |       |-- components/
|       |   |       |   |-- GameActions.tsx
|       |   |       |   `-- LocalGameLayout.tsx
|       |   |       |-- config/
|       |   |       |   `-- timeControls.ts
|       |   |       |-- pages/
|       |   |       |   |-- LocalGamePage.tsx
|       |   |       |   `-- LocalSetupPage.tsx
|       |   |       |-- services/
|       |   |       |   |-- localGameStorage.ts
|       |   |       |   `-- narrative.ts
|       |   |       |-- state/
|       |   |       |   |-- localClockStore.ts
|       |   |       |   `-- localGameStore.ts
|       |   |       |-- types.ts
|       |   |       `-- index.ts
|       |   |-- shared/
|       |   |   |-- persistence/
|       |   |   |   |-- database.ts
|       |   |   |   |-- migrations.ts
|       |   |   |   `-- schemas.ts
|       |   |   |-- ui/
|       |   |   |   |-- Button.tsx
|       |   |   |   |-- Dialog.tsx
|       |   |   |   `-- IconButton.tsx
|       |   |   `-- types/
|       |   |       `-- chess.ts
|       |   `-- styles/
|       |       `-- index.css
|       |-- e2e/
|       |   |-- local-game.spec.ts
|       |   |-- local-setup.spec.ts
|       |   |-- offline-install.spec.ts
|       |   `-- navigation.spec.ts
|       |-- index.html
|       |-- package.json
|       `-- vite.config.ts
|-- tools/
|   `-- verify-offline-build.mjs
|-- packages/
|   `-- chess-engine/
|       |-- src/
|       |-- tests/
|       `-- package.json
|-- docs/
|   |-- local-only-design/
|   |   |-- ARCHITECTURE_PLAN.md
|   |   |-- README.md
|   |   `-- PHASE_1...PHASE_6 implementation checkpoints
|   `-- UI_TROUBLESHOOTING.md
|-- package.json
|-- pnpm-workspace.yaml
`-- README.md
```

Exact component names may change during implementation, but the ownership
boundaries should remain.

## Structure Overview

### `app`

Contains application startup, global providers, and route composition. It should
know which features exist but contain no chess rules or game workflow logic.

Proposed routes:

| Route | Purpose |
| --- | --- |
| `/` | Local-game setup |
| `/game` | Active local game |
| `/play/local` | Compatibility redirect to `/` |
| `/play/local/game` | Compatibility redirect to `/game` |
| `*` | Redirect to `/` |

The current marketing/server-aware home page will be removed. Opening the app
will immediately present the local setup experience.

### `features/chess-board`

Contains reusable visual chess components. These components should not import
stores, API clients, sockets, authentication state, or route state. The local
game feature supplies their position, clock, move list, and event handlers.

### `features/local-game`

Owns the complete pass-and-play workflow:

- Initial game configuration
- Turn and move state
- Clock behavior
- Promotion and game completion
- Draw and resignation actions
- Local persistence
- Narrative messages

The current general `gameStore` will become `localGameStore` and lose all AI
fields and actions. The clock store remains separate because clock updates have a
different lifecycle, but it is owned by the same feature.

### `shared`

Contains small browser or presentation utilities that are genuinely used across
features. It must not become a holding area for domain-specific code.

The `persistence` module owns the IndexedDB connection, schema upgrades, and
transaction helpers. Feature-specific repositories, such as
`localGameStorage`, define what local-game data is stored.

### `packages/chess-engine`

Remains the single source of truth for chess rules. It must not depend on React,
Zustand, browser storage, network protocols, or Mandalorian presentation.

## Current Code Disposition

| Current area | Planned action |
| --- | --- |
| `LocalSetupPage`, `LocalGamePage` | Move into `features/local-game/pages` |
| `gameStore` | Split into a local-only store; remove AI state and actions |
| `clockStore` | Move into `features/local-game/state` |
| Board, move list, player panel, promotion UI | Move into `features/chess-board` |
| Narrative service | Move into `features/local-game/services` |
| Time-control definitions | Move from shared network types into local config |
| Existing localStorage usage | Keep tiny preferences only; move game recovery to IndexedDB |
| `HomePage` | Remove; local setup becomes the entry screen |
| `Header` | Replace with a minimal local app shell or remove |
| AI pages and Stockfish worker | Remove from this branch |
| Login, registration, profile pages | Remove from this branch |
| Matchmaking, online game, spectator pages | Remove from this branch |
| Auth/game hooks and auth store | Remove from this branch |
| API and Socket.IO clients | Remove from this branch |
| `apps/api` | Remove from this branch |
| `packages/shared-types` | Remove after local types are relocated |
| API, auth, online, spectator, and AI tests | Remove from the local-only suite |
| Generated `.js` siblings beside TS/TSX files | Remove and prevent re-emission |

The removed platform code remains available on `main` and in Git history. It
should not be copied into an `archive` directory because that would leave a
second, unmaintained application inside the workspace.

## Dependency Changes

The web app should retain only dependencies used by local play, such as React,
React Router, Zustand, the chess engine, animation utilities, and test tooling.

Expected removals include:

- `socket.io-client`
- `@mandalorian-chess/shared-types`
- Authentication and API-only packages
- Stockfish-specific packages or assets

The root workspace should stop building or testing deleted server packages. The
final dependency list will be confirmed from actual imports during implementation.

## Runtime And Infrastructure

### Development

The supported development command should start exactly one frontend process:

```powershell
pnpm dev
```

That command will run Vite for `apps/web`. Docker is not required.

### Production

`pnpm build` should produce a deployable PWA containing every required asset.
The production application must not depend on runtime network requests for
gameplay.

The deployed host must provide HTTPS and route fallback to `index.html`.
Hash-based routing may still be used to keep hosting requirements minimal.

The artifact must pass an automated offline-build check that scans generated
HTML, CSS, and JavaScript for remote URLs and verifies that all referenced local
assets exist.

### Android Delivery

The supported installation workflow will be:

1. Deploy the production build to its stable HTTPS URL
2. Email the recipient a link to that URL
3. Open the link in Google Chrome while online
4. Install the PWA through Chrome
5. Wait for the service worker to confirm that offline assets are ready
6. Launch the installed application in airplane mode
7. Play, close, and reopen a game to verify IndexedDB persistence

Google Chrome on Android is the target browser. Direct `file://` execution and
emailed static folders are not supported installation methods.

APK packaging will be considered as a separate later phase, not as part of this
first implementation. The same web build could later be placed in a minimal
Android WebView package. That package would:

- Bundle the static files inside the application
- Expose them through a stable local HTTPS-like origin
- Require no network permission
- Preserve IndexedDB between launches
- Produce an installable APK that can be handed to the tablet

A frontend-only container is not useful for this tablet handoff and is outside
the first iteration.

### Offline Updates

The tablet must temporarily reconnect to the internet to discover and download a
new PWA release. Because every release uses the same HTTPS origin, IndexedDB game
history remains available across updates.

Before an update is accepted, testing must confirm that:

- Existing IndexedDB data remains available
- Required schema migrations complete successfully
- An interrupted or failed migration does not destroy the previous saved game
- The new release precaches all assets and runs with networking disabled
- A complete old release remains usable until the new release is fully cached

When an update is ready, the app should show an explicit update action. It must
not force a reload during an active game. The update should activate after the
current state is checkpointed, then reload into the new release and run any
required IndexedDB migration.

History export and import remains required as a user-controlled backup and
device-transfer mechanism. APK delivery remains a separately planned phase.

The following infrastructure is outside this branch's target:

- API container
- PostgreSQL container
- Redis container
- Docker Compose orchestration
- Kubernetes manifests
- Backend environment variables and secrets
- Network load tests

## Persistence Model

IndexedDB will be the durable store for active and completed local games.
`localStorage` may be used only for small non-critical preferences such as the
last selected time control.

### Proposed Data

| Store | Contents |
| --- | --- |
| `activeGame` | Current position, move history, players, result, and save version |
| `clockState` | Remaining time, increment, active color, and last persisted timestamp |
| `completedGames` | Permanent history of all finished local games |
| `preferences` | Board orientation, sound, time-control choice, and display settings |

The saved game should contain enough domain data to reconstruct the engine. It
should not serialize Zustand internals or React state.

### Persistence Behavior

- Save after every accepted move and game-ending action
- Checkpoint clocks at controlled intervals and when the app is backgrounded
- Restore an unfinished game after the app or tablet restarts
- Present an explicit choice to resume or discard a recovered game
- Use a schema version and migration functions for every durable record
- Treat unreadable or unsupported records as recoverable corruption
- Never allow a storage failure to make an in-progress board unplayable
- Retain all completed games unless the user explicitly deletes or resets them
- Show a clear warning when browser storage is unavailable or approaching quota
- Request persistent browser storage when Chrome supports it
- Export and import active-game, history, and preference data as a versioned file
- Provide a reset option that clears local application data

Clock recovery needs special handling. The persistence layer will record a wall
clock timestamp whenever the state is checkpointed. Clocks will continue running
while Chrome is backgrounded or closed. On resume, elapsed real time will be
subtracted from the active player's clock before play continues. If the elapsed
time exceeds the remaining time, the game will be restored as a timeout result.

This behavior depends on the tablet's system clock. Large backward clock changes
will be treated as invalid elapsed time and surfaced as a recovery warning rather
than adding time to a player's clock.

## Tablet Experience

The primary layout target is an Android tablet in landscape orientation.

- The board and core actions must fit without vertical page scrolling
- Touch targets must be at least 44 by 44 CSS pixels
- Piece selection must work through tap-to-select and tap-to-move
- Dragging may be supported but cannot be the only interaction
- Legal-move, selected-square, check, and last-move states must remain clear
- Controls must not depend on hover
- Native browser text selection and long-press menus should not interrupt board play
- Safe-area insets and Android browser chrome must not cover controls
- The layout must tolerate common tablet aspect ratios and browser scaling
- Portrait mode should show a rotate-to-landscape screen rather than a broken board
- Accidental browser navigation and pull-to-refresh gestures should be minimized
- The app must remain usable with animation reduction enabled

The design will target current Google Chrome on Android rather than one tablet
model. Device-specific testing should still cover multiple common landscape
resolutions because screen size and Android display scaling affect the usable
viewport.

## Testing And CI

The local-only test pyramid will be:

1. Chess-engine unit tests for legal moves and terminal states
2. Store tests for turns, clocks, promotion, draw, resignation, and reset
3. Component tests for board interaction and action controls
4. Browser tests for the complete setup-to-game workflow
5. PWA installation, offline launch, cache-update, and IndexedDB migration tests

CI should run:

```text
install
lint
typecheck
test chess-engine
test web
build web
verify PWA and offline asset manifest
run local-play e2e
```

API tests, database services, online test fixtures, and network E2E suites will
be removed from this branch's workflow.

## Implementation Sequence

Detailed execution checklists and handoff records are indexed in
[README.md](./README.md).

### Phase 1: Establish Boundaries

- Create the `app`, `features`, and `shared` directories
- Move local pages, stores, services, and board components without changing behavior
- Update imports and keep compatibility routes working
- Add focused tests around the moved local workflow

### Phase 2: Remove Non-Local Features

- Remove auth, profile, matchmaking, online, spectator, and AI routes
- Remove their pages, hooks, stores, clients, fixtures, and tests
- Remove server-aware content from navigation and the home experience
- Relocate local types and time controls out of `shared-types`

### Phase 3: Simplify The Workspace

- Remove `apps/api` and `packages/shared-types`
- Remove Docker Compose, backend deployment files, and load tests
- Reduce root scripts, dependencies, CI, and environment examples
- Delete generated JavaScript files that duplicate TypeScript sources

### Phase 4: Add Offline Persistence

- Add the versioned IndexedDB database and local-game repositories
- Persist accepted moves, game results, preferences, and clock checkpoints
- Add resume, discard, reset, corruption recovery, and migration behavior
- Retain all completed games and provide history browsing
- Add versioned history export and import
- Use page visibility and lifecycle events to safely checkpoint game state
- Reconcile elapsed wall-clock time when Chrome resumes
- Add tests for restart recovery and schema upgrades

### Phase 5: Build And Deploy The PWA

- Add the web app manifest, tablet icons, theme metadata, and display settings
- Add a service worker that precaches the complete versioned application shell
- Add an offline-ready signal and explicit update-ready workflow
- Request persistent browser storage where Chrome supports it
- Configure routing and HTTPS static hosting
- Bundle all fonts, pieces, audio, scripts, styles, and metadata locally
- Add the generated-build offline verification script
- Deploy to a stable production URL and email the installation link
- Document Chrome installation, offline readiness, update, backup, and restore
- Test installation and launch in current Chrome for Android in airplane mode
- Record APK packaging as a separate future phase

### Phase 6: Verify The Product

- Start the project with one Vite process
- Exercise setup, legal/illegal moves, clocks, promotion, draw, resignation, and reset
- Verify Mandalorian assets on desktop and the target landscape tablet
- Confirm browser refresh behavior and compatibility redirects
- Confirm no runtime request is made to an API or WebSocket endpoint
- Confirm active games recover after closing and reopening the app
- Confirm the installed PWA works in airplane mode
- Confirm an application update preserves history and the active game

## Acceptance Criteria

- `pnpm dev` starts the playable app without Docker or backend services
- The PWA installs from Chrome and is playable in airplane mode after installation
- The first screen is local-game setup
- A complete pass-and-play game can be played in one browser
- No login, online, spectator, profile, rating, or AI UI remains
- No API or WebSocket request occurs during use
- No imports reference removed auth, online, AI, or shared-network modules
- Only one local-game store owns gameplay state
- The board presentation has no knowledge of the game mode or transport
- Unit and browser tests cover the local workflow
- IndexedDB restores a valid unfinished game after the application is closed
- The active clock accounts for elapsed time while Chrome is hidden or closed
- All completed games remain available until explicitly deleted
- Game history can be exported and imported as a versioned backup
- Storage schema upgrades preserve compatible saved games
- All required assets are bundled and verified during the build
- PWA updates never interrupt an active game or expose mixed-version assets
- Landscape touch controls require no hover, mouse, or physical keyboard
- CI builds and tests only the local web app and chess engine
- Documentation describes the one-process development workflow

## Confirmed Review Decisions

The following choices were confirmed before implementation:

1. **AI scope:** Defer computer play so the first iteration is strictly
   pass-and-play.
2. **Server code:** Remove it from this branch rather than retaining an inactive
   archive directory.
3. **Entry route:** Make local setup the `/` route instead of keeping a landing page.
4. **Compatibility routes:** Keep redirects from the existing local URLs.
5. **Containers:** Remove required container orchestration; revisit an optional
   Android package in a separate later phase.
6. **PWA hosting:** Select the stable HTTPS host and production URL. The host
   needs only static-file deployment, TLS, cache headers, and route fallback; it
   does not require the removed application API or database.

Confirmed delivery and persistence decisions:

- Target current Google Chrome on Android, without coupling to one tablet model
- Continue the active chess clock while Chrome is hidden or closed
- Retain all completed games until the user explicitly deletes them
- Email a stable HTTPS installation link for the Chrome PWA
- Require one online installation before completely offline play
- Reconnect temporarily when the user chooses to download an update
- Discuss APK packaging as a separate phase
