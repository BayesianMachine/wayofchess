# Phase 2 - Remove Non-Local Features

**Status:** Complete  
**Depends on:** Phase 1 complete  
**Unlocks:** Phase 3 - Simplify The Workspace

## Objective

Turn the frontend into a local pass-and-play product by removing authentication,
profiles, matchmaking, online games, spectators, AI play, and every frontend
dependency on server-authoritative behavior.

## Starting Conditions

- Phase 1 boundaries and tests pass.
- Non-local features still exist but local play has isolated ownership.
- Backend packages remain in the workspace until Phase 3.

## Work Checklist

### Routes And Navigation

- [x] Make local setup the `/` route.
- [x] Make the active local game available at `/game`.
- [x] Redirect `/play/local` to `/`.
- [x] Redirect `/play/local/game` to `/game`.
- [x] Redirect unknown routes to `/`.
- [x] Remove login, registration, profile, matchmaking, online, spectator, and AI routes.
- [x] Remove server-aware navigation and account controls.
- [x] Replace or remove the existing landing page and header.

### Feature Removal

- [x] Remove login and registration pages.
- [x] Remove profile pages and rating presentation.
- [x] Remove matchmaking and online-game pages.
- [x] Remove spectator lobby and spectator-game pages.
- [x] Remove AI setup, AI game pages, and Stockfish integration.
- [x] Remove auth and online-game hooks.
- [x] Remove auth store and AI-specific store state/actions.
- [x] Remove REST and Socket.IO clients.
- [x] Remove online, auth, spectator, profile, and AI fixtures and browser tests.

### Local Type Ownership

- [x] Move time controls into `features/local-game/config/timeControls.ts`.
- [x] Move local chess UI types into web or chess-engine ownership.
- [x] Remove frontend imports from `@mandalorian-chess/shared-types`.
- [x] Remove online event types from the local application.
- [x] Reduce `localGameStore` to pass-and-play state and actions only.

### Product Experience

- [x] Ensure the first screen is the local setup workflow.
- [x] Ensure no text promises accounts, ratings, online play, AI, or spectators.
- [x] Ensure no empty navigation affordances remain after feature removal.
- [x] Preserve the Mandalorian visual treatment.
- [x] Verify local gameplay works without API or socket services running.

### Dependency And Network Audit

- [x] Remove unused frontend network/auth dependencies.
- [x] Search for `/api`, WebSocket, Socket.IO, auth token, and Stockfish references.
- [x] Run the app with Docker and backend services stopped.
- [x] Verify the browser makes no application API or WebSocket requests.
- [x] Update frontend environment examples to remove server variables.

## Expected Deletions

The exact paths must be confirmed before deletion. Expected categories:

```text
auth pages, hooks, and store
profile pages
matchmaking and online-game pages
spectator pages
AI pages and worker integration
API and Socket.IO clients
non-local E2E specs and fixtures
server-aware home and header content
```

Do not remove `apps/api`, `packages/shared-types`, Docker, or deployment files
until Phase 3, after all frontend references are proven gone.

## Verification Matrix

| Check | Required evidence |
| --- | --- |
| `/` opens local setup | Route test and screenshot |
| `/game` supports local play | E2E result |
| Compatibility redirects work | Route test |
| Removed URLs do not expose features | Route test |
| No auth/online/AI UI remains | Screenshots and source search |
| No API/socket traffic occurs | Browser network evidence |
| Backend can remain stopped | Recorded run result |
| Local game store has no AI state | Source search or unit test |

## Acceptance Criteria

- [x] Only local pass-and-play routes and UI remain.
- [x] No auth, profile, online, spectator, rating, or AI module is imported.
- [x] No runtime application request targets an API or WebSocket.
- [x] Local play works while all backend services are stopped.
- [x] Web dependencies no longer include unused online/auth packages.
- [x] Local types and time controls no longer depend on shared network types.
- [x] Local tests, typecheck, and build pass.
- [x] Verification evidence and changed-file inventory are complete.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-06-08 | Preserve legacy local persisted games and reject legacy AI records during rehydration. | Existing local users should not lose an active game when the store becomes local-only. | The storage key remains stable while the persisted schema becomes local-only. |
| 2026-06-08 | Keep generated `.js` siblings untouched until Phase 3. | Phase 3 owns generated-output cleanup and build emission fixes. | Source audits in this phase target retained TypeScript files. |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| 2026-06-08 | Fail the network audit on every WebSocket. | Permit only Vite's same-origin development HMR socket on port 5173; reject all application sockets and former backend traffic. | A development server necessarily opens its own HMR channel, which is not application infrastructure. | The static Phase 4 build will have no HMR socket. |
| 2026-06-08 | Use the package `build` script for production verification. | Run `tsc --noEmit` followed by `vite build`. | The current `tsc` configuration emits tracked JavaScript twins; their cleanup is explicitly owned by Phase 3. | Correct TypeScript emission settings in Phase 3, then restore the package build as the canonical command. |

## Blockers And Failed Approaches

| Date | Issue or attempt | Outcome | Resolution or owner |
| --- | --- | --- | --- |
| 2026-06-08 | The first network audit treated Vite's HMR WebSocket as application traffic. | One test failed in each viewport. | Restricted the exception to the same-origin Vite development socket; API, Socket.IO, backend-port, and all other WebSocket traffic still fail the test. |
| 2026-06-08 | The first character-piece test searched for images beneath the accessibility grid. | The selector found zero images because the animated visual layer is a sibling overlay. | Assert all 32 page images plus representative Mandalorian and Imperial character labels. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web lint` scans tracked generated JavaScript twins. | Four stale `.js` files reference an unavailable `react-hooks/exhaustive-deps` rule. | Retained TypeScript no longer contains that suppression; generated-output removal remains Phase 3 work. |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| 2026-06-08 | `pnpm install --lockfile-only --ignore-scripts` | Passed; removed web-only Socket.IO client resolution while preserving backend workspace dependencies. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web typecheck` | Passed. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/chess-engine test` | Passed: 13 tests. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web exec vite build` | Passed: 448 modules transformed. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web exec playwright test` | Passed: 78 tests across desktop Chromium and landscape tablet. |
| 2026-06-08 | Retained TypeScript import/dependency searches | Passed; no frontend auth, profile, rating, online, spectator, AI, API, socket, Stockfish, or shared-network-type imports remain. |
| 2026-06-08 | `git diff --name-only -- '*.js'` | Passed; no tracked generated JavaScript sibling was modified. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web lint` | Known Phase 3 limitation: four generated `.js` twins fail on stale rule suppressions; retained TypeScript is clean. |

### Runtime And Visual Evidence

| Date | Evidence | Artifact or notes | Result |
| --- | --- | --- | --- |
| 2026-06-08 | Desktop local setup | `evidence/phase-2/desktop-setup.png` | Passed; setup is the first screen with no account or platform navigation. |
| 2026-06-08 | Desktop local game | `evidence/phase-2/desktop-game.png` | Passed; character pieces, controls, clocks, and move area render correctly. |
| 2026-06-08 | Landscape tablet local game | `evidence/phase-2/tablet-landscape-game.png` | Passed at 1280x800 with touch emulation. |
| 2026-06-08 | Runtime browser inspection | `/game` showed all 64 board squares, both local player panels, and Mandalorian/Imperial character labels. | Passed. |
| 2026-06-08 | Backend-independent run | Docker CLI/services were unavailable while the existing single Vite listener served the complete app; the E2E network audit observed no application backend traffic. | Passed. |

### Changed Files

- Added: local-only app routes, local chess types, time-control config,
  `localGameStore`, and Phase 2 visual evidence.
- Moved: local pages/state/services, board components, and shared UI into the
  Phase 1 feature boundaries.
- Modified: app shell, Vite configuration, web Dockerfile, web dependencies,
  lockfile, local E2E coverage, Playwright projects, and checkpoint documents.
- Deleted: TypeScript auth/profile/rating/online/spectator/AI pages and modules,
  REST/socket/Stockfish clients, landing/header/ranking UI, and non-local E2E
  specs, fixtures, and page objects.

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| 2026-06-08 | In Progress | Phase 2 implementation started from the completed Phase 1 working tree. |
| 2026-06-08 | In Progress | Local-only routes, state, types, dependencies, and test surface implemented. |
| 2026-06-08 | Verified | Typecheck, chess-engine tests, production Vite build, and all 78 browser tests passed. |
| 2026-06-08 | Complete | Acceptance criteria passed; Phase 3 unlocked. |

## Next Handoff

- Final commit: Integrated with Phase 1 in `c35584d`.
- Remaining known risks: tracked generated `.js` twins still contain removed
  code and prevent a clean ESLint run until Phase 3.
- Important decisions: legacy active local games rehydrate under the stable
  `mando-chess-game` key; legacy AI records are ignored.
- Verified commands: web typecheck, 13 chess-engine tests, Vite production
  build, 78 Playwright tests, source/dependency audits, and generated-JavaScript
  diff audit.
- Phase 3 may begin: Yes
