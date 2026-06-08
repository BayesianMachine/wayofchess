# Phase 1 - Establish Boundaries

**Status:** Complete  
**Depends on:** Approved architecture plan  
**Unlocks:** Phase 2 - Remove Non-Local Features

## Objective

Reorganize the existing frontend into explicit application, local-game,
chess-board, and shared boundaries without intentionally changing user-visible
behavior. This phase creates a stable structure from which non-local features
can be removed safely.

## Starting Conditions

- Branch is `feature/local-only`.
- Existing local, AI, online, auth, and spectator behavior still exists.
- Local game routes currently work.
- Mandalorian piece assets render correctly.

## Target Boundaries

- `src/app`: startup, providers, and route composition
- `src/features/local-game`: local setup and game workflow
- `src/features/chess-board`: reusable board presentation
- `src/shared`: genuinely cross-feature UI and browser utilities
- `packages/chess-engine`: framework-independent rules

## Work Checklist

### Baseline

- [x] Record the starting commit, branch, and dirty-worktree state.
- [x] Run and record the current lint, typecheck, unit, build, and relevant E2E results.
- [x] Capture desktop and landscape-tablet screenshots of local setup and gameplay.
- [x] Inventory imports used by the local setup and game routes.
- [x] Identify generated `.js` siblings but leave deletion for Phase 3.

### Application Shell

- [x] Create `apps/web/src/app`.
- [x] Move route composition into `app/routes.tsx`.
- [x] Move or adapt the application shell into `app/App.tsx`.
- [x] Keep `main.tsx` limited to mounting providers and the app.
- [x] Preserve existing URLs during the move.

### Local-Game Feature

- [x] Create `features/local-game/pages`.
- [x] Move `LocalSetupPage` and `LocalGamePage`.
- [x] Create `features/local-game/state`.
- [x] Move local clock behavior into `localClockStore`.
- [x] Move the existing game store into the feature without removing AI behavior yet.
- [x] Create `features/local-game/config` for local configuration.
- [x] Create `features/local-game/services`.
- [x] Move narrative and local-storage helpers into feature ownership.
- [x] Add a feature public API through `features/local-game/index.ts`.

### Chess-Board Feature

- [x] Create `features/chess-board/components`.
- [x] Move `Board`, `MoveList`, `PlayerPanel`, and promotion UI.
- [x] Move board-only types into `features/chess-board/model`.
- [x] Ensure board components receive state and actions through props.
- [x] Remove direct imports from board components into route modules.
- [x] Add a feature public API through `features/chess-board/index.ts`.

### Shared Code

- [x] Create `shared/ui`, `shared/types`, and other justified shared folders.
- [x] Move only code used by more than one feature.
- [x] Keep local-game-specific utilities inside `features/local-game`.
- [x] Avoid introducing a generic catch-all utilities module.

### Imports And Tests

- [x] Update aliases and imports to the new structure.
- [x] Remove imports of moved modules through legacy paths.
- [x] Add or update focused tests around local setup and gameplay.
- [x] Confirm route compatibility and browser refresh behavior.
- [x] Confirm behavior and visuals match the baseline screenshots.

## Expected File Operations

Likely additions or moves:

```text
apps/web/src/app/
apps/web/src/features/chess-board/
apps/web/src/features/local-game/
apps/web/src/shared/
```

Do not remove auth, multiplayer, spectator, AI, backend, or infrastructure code
in this phase.

## Verification Matrix

| Check | Required evidence |
| --- | --- |
| Local setup opens | Route and screenshot |
| Local game starts | E2E result and screenshot |
| Legal move works | Test result |
| Illegal move is rejected | Test result |
| Clock behavior is unchanged | Test or recorded manual check |
| Mandalorian pieces render | Desktop and landscape screenshots |
| Legacy local URLs work | Route test |
| Build succeeds | Exact command and result |
| Boundary imports are clean | Search command and result |

## Acceptance Criteria

- [x] App, local-game, chess-board, and shared boundaries exist.
- [x] Local setup and gameplay behavior remain functional.
- [x] Board presentation does not import route, auth, API, or socket state.
- [x] Compatibility local routes still work.
- [x] Focused tests cover the moved local workflow.
- [x] Lint, typecheck, tests, and build pass or documented pre-existing failures remain unchanged.
- [x] Verification evidence and changed-file inventory are complete.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-06-08 | Move the mixed local/AI game store intact behind the local-game feature API. | Phase 1 is structural; splitting behavior belongs to Phase 2. | AI temporarily imports state from the local-game feature. |
| 2026-06-08 | Keep `EvalBar` and rank components in their legacy locations. | `EvalBar` is unused/AI-oriented and rank UI is removed later. | They are intentionally outside the new Phase 1 boundaries. |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| 2026-06-08 | Move `PlayerPanel` with board components. | Moved it to `shared/ui`. | It is also used by AI, online, and spectator pages and includes rank presentation. | Reassess after non-local features are removed in Phase 2. |
| 2026-06-08 | Run the package `build` script. | Ran `tsc --noEmit` followed by `vite build`. | The package script runs emitting `tsc`, which would create new generated `.js` siblings before Phase 3. | Phase 3 will correct build emission and restore the canonical package build. |
| 2026-06-08 | Capture before-and-after screenshots during this phase. | Captured post-refactor evidence and compared it with the supplied pre-refactor UI screenshots. | The Vite server was not running when implementation began, so no new baseline image could be generated first. | Use the recorded Phase 1 images as the baseline for later phases. |

## Blockers And Failed Approaches

| Date | Issue or attempt | Outcome | Resolution or owner |
| --- | --- | --- | --- |
| 2026-06-08 | ESLint references `react-hooks/exhaustive-deps` without configuring the plugin; one existing spectator import is unused. | Lint reports nine pre-existing errors, including the same directives in source and generated `.js` files. | Defer lint/toolchain cleanup to Phase 3; no new lint category was introduced. |
| 2026-06-08 | Full Chromium E2E username assertion uses non-exact text `Din`. | One test fails because the “DIN” piece label and username “Din” both match; 101 pass and one is skipped. | Local Phase 1 suite passes; tighten this unrelated online test before removing it in Phase 2 if needed. |
| 2026-06-08 | In-app browser screenshot capture timed out on the animated board. | DOM verification succeeded, but image capture did not. | Generated deterministic evidence with the repository Playwright CLI. |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| 2026-06-08 | `git status --short --branch` | Branch `feature/local-only`; design documents were untracked. |
| 2026-06-08 | `git log -1 --format=...` | Starting commit `9e06a93f987bdc408db34d1d2017ccbb42d84d68`. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web typecheck` | Passed. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/chess-engine test` | Passed: 13 tests. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web exec vite build` | Passed: 511 modules transformed and production assets emitted to `dist`. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web exec playwright test e2e/local-game.spec.ts --project=chromium` | Passed: 21 tests, including direct-route refresh. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web exec playwright test --project=chromium` | 101 passed, 1 skipped, 1 unrelated strict-text failure for “Din”/“DIN”. |
| 2026-06-08 | Legacy-import `rg` audit | No moved TypeScript imports remain. |
| 2026-06-08 | Board-boundary `rg` audit | No route, store, auth, API, socket, or game-hook imports. |
| 2026-06-08 | `git diff --name-status -- '*.js'` | No tracked generated JavaScript file changed. |
| 2026-06-08 | `pnpm --filter @mandalorian-chess/web lint` | Known baseline configuration failure documented above. |

### Visual Evidence

| Date | Viewport/device | Artifact | Result |
| --- | --- | --- | --- |
| 2026-06-08 | Desktop 1440x900 setup | [desktop-setup.png](./evidence/phase-1/desktop-setup.png) | Setup and legacy navigation render correctly. |
| 2026-06-08 | Desktop 1440x900 game | [desktop-game.png](./evidence/phase-1/desktop-game.png) | Board, pieces, panels, moves, and actions render correctly. |
| 2026-06-08 | Tablet landscape 1280x800 game | [tablet-landscape-game.png](./evidence/phase-1/tablet-landscape-game.png) | Landscape layout and Mandalorian pieces render correctly. |

### Changed Files

- Added: app routes; feature/shared index files; board model; local-game config,
  types, and storage service; Phase 1 evidence images.
- Moved: app shell; local pages, stores, and narrative service; board components;
  common buttons, providers, overlays, modal, spinner, and player panel.
- Modified: root entrypoint; retained feature consumers; local E2E specification;
  design and checkpoint documents.
- Deleted: no behavior or infrastructure modules; old TypeScript paths are
  represented as moves. Generated `.js` siblings remain for Phase 3.

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| 2026-06-08 | In Progress | Baseline recorded; dependency graph inspected; structural implementation started. |
| 2026-06-08 | In Progress | App, local-game, chess-board, and shared boundaries created; retained consumers repointed. |
| 2026-06-08 | In Progress | Local storage contract extracted and direct-route refresh coverage added. |
| 2026-06-08 | Complete | Acceptance gate passed with known pre-existing lint and online-test issues documented. |

## Next Handoff

Complete this section when the phase passes:

- Final commit: Not yet committed.
- Remaining known risks: ESLint plugin configuration is incomplete; one online
  E2E text locator is ambiguous; generated `.js` siblings still exist by design.
- Important decisions: Mixed AI/local store remains transitional; shared
  `PlayerPanel` remains outside the board feature; package build emission cleanup
  is deferred to Phase 3.
- Verified commands: web typecheck, chess-engine tests, Vite production build,
  21 local Chromium tests, full Chromium regression suite, import audits.
- Phase 2 may begin: Yes
