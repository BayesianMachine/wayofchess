# Phase 4 - Add Offline Persistence

**Status:** Complete
**Depends on:** Phase 3 complete  
**Unlocks:** Phase 5 - Build And Deploy The PWA

## Objective

Add durable, versioned IndexedDB persistence for active games, clocks,
preferences, and complete game history. Restore safely across browser restarts,
continue clocks while Chrome is hidden or closed, and support backup transfer.

## Data Model

Minimum logical stores:

| Store | Required content |
| --- | --- |
| `activeGame` | Position, move list, players, status, result, and schema version |
| `clockState` | Remaining times, increment, active color, checkpoint timestamp |
| `completedGames` | Every completed game until explicit deletion |
| `preferences` | Time control, orientation, sound, and display preferences |

Persist domain records, not Zustand or React internals.

## Work Checklist

### Database Foundation

- [x] Select and document the IndexedDB access approach.
- [x] Create `shared/persistence/database.ts`.
- [x] Define schema and record versions in `schemas.ts`.
- [x] Add ordered, idempotent migrations in `migrations.ts`.
- [x] Define transaction and error-handling conventions.
- [x] Add database open, upgrade, close, and reset tests.

### Local-Game Repository

- [x] Create feature-owned persistence repository methods.
- [x] Save after every accepted move.
- [x] Save after draw, resignation, timeout, promotion, and game completion.
- [x] Persist only after state transitions are valid.
- [x] Keep the in-memory game playable when a write fails.
- [x] Surface storage failures without discarding current state.

### Recovery Workflow

- [x] Detect an unfinished game during application startup.
- [x] Offer explicit Resume and Discard actions.
- [x] Reconstruct the chess engine from stored domain data.
- [x] Validate position, move history, clock state, and schema version.
- [x] Handle missing, unsupported, or corrupt records safely.
- [x] Test closing and reopening Chrome during an active game.

### Clock Reconciliation

- [x] Save a wall-clock timestamp with every clock checkpoint.
- [x] Checkpoint on moves and page visibility changes.
- [x] On resume, subtract elapsed time from the active player.
- [x] Restore as timeout when elapsed time exceeds remaining time.
- [x] Prevent backward system-clock changes from adding player time.
- [x] Document behavior for large or invalid clock jumps.
- [x] Test hidden, terminated, restarted, and timeout scenarios.

### Completed History

- [x] Move finished games atomically from active state into history.
- [x] Retain every completed game until explicit deletion.
- [x] Add a history list ordered by completion time.
- [x] Add a history detail view with moves, result, and time control.
- [x] Add explicit single-game deletion with confirmation.
- [x] Add explicit clear-all/reset behavior with confirmation.
- [x] Show storage availability or quota warnings where possible.

### Backup And Transfer

- [x] Define a versioned export file schema.
- [x] Export active game, history, and preferences.
- [x] Validate imports before modifying the database.
- [x] Define merge or replace semantics and document the choice.
- [x] Make import atomic or rollback on failure.
- [x] Test export from one database and import into a clean database.
- [x] Test unsupported and corrupt backup files.

### Browser Storage Policy

- [x] Request persistent storage when supported.
- [x] Handle denial without blocking gameplay.
- [x] Display a concise storage-risk warning when persistence is unavailable.
- [x] Keep tiny non-critical preferences in localStorage only if justified.

## Verification Matrix

| Scenario | Required evidence |
| --- | --- |
| Move survives restart | Automated test |
| Resume reconstructs legal state | Automated test |
| Discard removes active game | Automated test |
| Hidden-time clock is deducted | Automated clock test |
| Closed-time timeout is detected | Automated clock test |
| Backward clock change adds no time | Automated test |
| Completed game enters history | Integration/E2E result |
| History remains after restart | E2E result |
| Export/import round trip works | Automated test |
| Migration preserves old records | Migration fixture test |
| Corrupt data does not crash app | Automated test |

## Acceptance Criteria

- [x] An unfinished game restores after Chrome closes and reopens.
- [x] Active clocks account for elapsed hidden or closed time.
- [x] All completed games remain until explicitly deleted.
- [x] History browsing is usable in landscape touch mode.
- [x] Schema migrations preserve compatible records.
- [x] Corrupt or unsupported data fails safely.
- [x] Export/import provides a versioned recovery path.
- [x] Storage failure does not make the in-memory game unplayable.
- [x] Persistence unit, integration, and browser tests pass.
- [x] Verification evidence and changed-file inventory are complete.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-06-08 | Use `idb` with explicit typed records and repositories. | It keeps IndexedDB transactions readable without hiding schema ownership. | `idb` is the only new runtime dependency. |
| 2026-06-08 | Show recovery on the setup screen. | Users must choose Resume or Discard before a new game can overwrite durable state. | `/game` redirects to setup when no in-memory session exists. |
| 2026-06-08 | Merge backups by stable game ID and newest timestamp. | Imports should preserve both devices' unique history without silent replacement. | Import is validated first and applied atomically. |
| 2026-06-08 | Resume legacy timed games untimed with a warning. | The previous implementation never persisted remaining clocks. | Position and moves survive without inventing clock values. |
| 2026-06-08 | Serialize repository writes while keeping UI state immediate. | Move and clock checkpoints can overlap during play and lifecycle events. | Storage failures surface as warnings and never roll back a legal in-memory move. |
| 2026-06-08 | Centralize accepted-move side effects by observed move count. | Both drag and tap controls must checkpoint clocks and persistence identically. | Narrative, increments, clock switching, and persistence run once for every accepted move path. |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| 2026-06-08 | Capture screenshots from the in-app browser. | The live browser verified the recovery DOM, but its screenshot channel timed out. | A temporary Playwright evidence spec recreated the same IndexedDB states and was removed after writing the artifacts. | None. |

## Blockers And Failed Approaches

| Date | Issue or attempt | Outcome | Resolution or owner |
| --- | --- | --- | --- |
| 2026-06-08 | Initial Phase 4 E2E run rendered blank pages. | The long-lived Vite process had lost its esbuild child process after earlier cleanup. | Restarted the single Vite server and reran the suite successfully. |
| 2026-06-08 | Tap-to-move did not initially checkpoint persistence or clocks. | The tap path bypassed the drag handler where side effects were attached. | Moved accepted-move side effects into one move-count effect shared by both interaction paths. |
| 2026-06-08 | First store-creation assertion used a DOMStringList assumption. | The fake IndexedDB store-name collection did not match that assertion shape. | Normalized it with `Array.from` before comparison. |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| 2026-06-08 | `pnpm lint` | Passed. |
| 2026-06-08 | `pnpm typecheck` | Passed. |
| 2026-06-08 | `pnpm test` | Passed: 12 web persistence tests and 13 chess-engine tests. |
| 2026-06-08 | `pnpm test:e2e` | Passed: 86 tests across desktop Chromium and landscape tablet. |
| 2026-06-08 | `pnpm build` twice | Both builds passed; 460 modules transformed; no source-adjacent JavaScript emitted or tracked changes produced. |
| 2026-06-08 | Phase 4 evidence Playwright run | Passed: recovery, history list, history detail, and 1280x800 landscape screenshots captured. |

### Persistence Fixtures And Artifacts

| Date | Artifact | Purpose | Result |
| --- | --- | --- | --- |
| 2026-06-08 | `evidence/phase-4/recovery-setup.png` | Resume/Discard recovery gate and storage warning. | Passed visual review. |
| 2026-06-08 | `evidence/phase-4/history-list.png` | Newest-first completed-game history and deletion controls. | Passed visual review. |
| 2026-06-08 | `evidence/phase-4/history-detail.png` | Final Mandalorian board, result, clocks, and move list. | Passed visual review. |
| 2026-06-08 | `evidence/phase-4/history-detail-tablet-landscape.png` | 1280x800 touch-oriented history detail layout. | Passed visual review. |

### Changed Files

- Added: typed IndexedDB schema/database/migrations, game repository and lifecycle
  services, clock reconciliation, legacy migration, storage-health service,
  history/data pages, Vitest setup, 12 persistence tests, and Phase 4 evidence.
- Modified: local setup/game pages, routes, local-game exports, game/clock
  stores, local preference storage, E2E coverage, package manifests, and lockfile.
- Deleted: no Phase 4-owned production files; the temporary evidence spec was
  removed after screenshot capture.

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| 2026-06-08 | In Progress | Phase 4 implementation started from the completed Phase 3 working tree. |
| 2026-06-08 | In Progress | IndexedDB repositories, migration, recovery, clocks, history, backup/import, and storage-health handling implemented. |
| 2026-06-08 | In Progress | Fixed tap-to-move lifecycle parity and restarted the stale Vite/esbuild process discovered by E2E. |
| 2026-06-08 | Complete | Lint, typecheck, 25 unit/engine tests, 86 browser tests, repeated builds, network audit, and visual evidence passed. |

## Next Handoff

- Final commit: `c7de7e5`.
- Database version: `mandalorian-chess` version 1; record version 1.
- Export format version: `mandalorian-chess-backup` version 1.
- Remaining known risks: Chrome may deny persistent storage or evict data under
  pressure, so the setup screen warns users and the backup workflow remains the
  portable recovery path.
- Verified commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm test:e2e`, and two consecutive `pnpm build` runs.
- Phase 5 may begin: Yes
