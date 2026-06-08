# Phase 4 - Add Offline Persistence

**Status:** Not Started  
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

- [ ] Select and document the IndexedDB access approach.
- [ ] Create `shared/persistence/database.ts`.
- [ ] Define schema and record versions in `schemas.ts`.
- [ ] Add ordered, idempotent migrations in `migrations.ts`.
- [ ] Define transaction and error-handling conventions.
- [ ] Add database open, upgrade, close, and reset tests.

### Local-Game Repository

- [ ] Create feature-owned persistence repository methods.
- [ ] Save after every accepted move.
- [ ] Save after draw, resignation, timeout, promotion, and game completion.
- [ ] Persist only after state transitions are valid.
- [ ] Keep the in-memory game playable when a write fails.
- [ ] Surface storage failures without discarding current state.

### Recovery Workflow

- [ ] Detect an unfinished game during application startup.
- [ ] Offer explicit Resume and Discard actions.
- [ ] Reconstruct the chess engine from stored domain data.
- [ ] Validate position, move history, clock state, and schema version.
- [ ] Handle missing, unsupported, or corrupt records safely.
- [ ] Test closing and reopening Chrome during an active game.

### Clock Reconciliation

- [ ] Save a wall-clock timestamp with every clock checkpoint.
- [ ] Checkpoint on moves and page visibility changes.
- [ ] On resume, subtract elapsed time from the active player.
- [ ] Restore as timeout when elapsed time exceeds remaining time.
- [ ] Prevent backward system-clock changes from adding player time.
- [ ] Document behavior for large or invalid clock jumps.
- [ ] Test hidden, terminated, restarted, and timeout scenarios.

### Completed History

- [ ] Move finished games atomically from active state into history.
- [ ] Retain every completed game until explicit deletion.
- [ ] Add a history list ordered by completion time.
- [ ] Add a history detail view with moves, result, and time control.
- [ ] Add explicit single-game deletion with confirmation.
- [ ] Add explicit clear-all/reset behavior with confirmation.
- [ ] Show storage availability or quota warnings where possible.

### Backup And Transfer

- [ ] Define a versioned export file schema.
- [ ] Export active game, history, and preferences.
- [ ] Validate imports before modifying the database.
- [ ] Define merge or replace semantics and document the choice.
- [ ] Make import atomic or rollback on failure.
- [ ] Test export from one database and import into a clean database.
- [ ] Test unsupported and corrupt backup files.

### Browser Storage Policy

- [ ] Request persistent storage when supported.
- [ ] Handle denial without blocking gameplay.
- [ ] Display a concise storage-risk warning when persistence is unavailable.
- [ ] Keep tiny non-critical preferences in localStorage only if justified.

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

- [ ] An unfinished game restores after Chrome closes and reopens.
- [ ] Active clocks account for elapsed hidden or closed time.
- [ ] All completed games remain until explicitly deleted.
- [ ] History browsing is usable in landscape touch mode.
- [ ] Schema migrations preserve compatible records.
- [ ] Corrupt or unsupported data fails safely.
- [ ] Export/import provides a versioned recovery path.
- [ ] Storage failure does not make the in-memory game unplayable.
- [ ] Persistence unit, integration, and browser tests pass.
- [ ] Verification evidence and changed-file inventory are complete.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| TBD |  |  |  |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| TBD |  |  |  |  |

## Blockers And Failed Approaches

| Date | Issue or attempt | Outcome | Resolution or owner |
| --- | --- | --- | --- |
| TBD |  |  |  |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| TBD |  |  |

### Persistence Fixtures And Artifacts

| Date | Artifact | Purpose | Result |
| --- | --- | --- | --- |
| TBD |  |  |  |

### Changed Files

- Added:
- Modified:
- Deleted:

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| TBD | Not Started | Phase document created. |

## Next Handoff

- Final commit:
- Database version:
- Export format version:
- Remaining known risks:
- Verified commands:
- Phase 5 may begin: No

