# Phase 3 - Simplify The Workspace

**Status:** Complete
**Depends on:** Phase 2 complete  
**Unlocks:** Phase 4 - Add Offline Persistence

## Objective

Remove server-only packages and orchestration, reduce the workspace to the web
application and chess engine, and establish one predictable local development
process.

## Work Checklist

### Pre-Removal Audit

- [x] Confirm the web app has no imports from `apps/api` or `packages/shared-types`.
- [x] Confirm no retained test depends on PostgreSQL, Redis, API, or sockets.
- [x] Record all root scripts and CI jobs before changing them.
- [x] Inventory Docker, Kubernetes, deployment, load-test, and backend environment files.
- [x] Verify all deletions remain recoverable from `main` and Git history.

### Workspace Reduction

- [x] Remove `apps/api`.
- [x] Remove `packages/shared-types`.
- [x] Update `pnpm-workspace.yaml`.
- [x] Update root TypeScript/project references if present.
- [x] Regenerate the lockfile using the repository package manager.
- [x] Confirm only intended workspaces remain discoverable.

### Infrastructure Removal

- [x] Remove Docker Compose configuration.
- [x] Remove API/database/Redis Dockerfiles and configuration.
- [x] Remove Kubernetes manifests and backend deployment files.
- [x] Remove network load tests.
- [x] Remove backend-only environment templates and secrets documentation.
- [x] Retain only static-host/PWA deployment material justified by Phase 5.

### Scripts And CI

- [x] Make root `pnpm dev` start exactly one Vite frontend.
- [x] Make root `pnpm build` build the web app and required chess-engine package.
- [x] Simplify lint, typecheck, test, and clean scripts.
- [x] Remove API and service-container CI jobs.
- [x] Keep web, chess-engine, and browser-test CI coverage.
- [x] Update README setup and development commands.

### Generated File Cleanup

- [x] Identify `.js` files emitted beside `.ts` or `.tsx` source files.
- [x] Distinguish generated siblings from intentional JavaScript configuration.
- [x] Delete only confirmed generated duplicates.
- [x] Configure TypeScript builds to prevent in-place emission.
- [x] Add ignore rules for generated output directories where needed.
- [x] Run the build twice and confirm the source tree remains clean.

### Duplicate Process Prevention

- [x] Document the single supported start command.
- [x] Remove scripts that silently start Docker or multiple app stacks.
- [x] Ensure Vite fails clearly or selects an intentional port when one is occupied.
- [x] Document how to identify and stop an existing local Vite process.

## Target Workspace

```text
apps/web
packages/chess-engine
docs
root package and workspace configuration
```

## Verification Matrix

| Check | Required evidence |
| --- | --- |
| Workspace package list is minimal | Package-manager output |
| One command starts one Vite app | Process and terminal evidence |
| Docker is not running or required | Runtime evidence |
| Clean install succeeds | Exact command and result |
| Source tree remains clean after build | Git status before/after |
| CI configuration has no backend jobs | Diff and source search |
| Local game remains playable | E2E result |

## Acceptance Criteria

- [x] Workspace contains only the web app and chess engine as executable packages.
- [x] Docker, Kubernetes, database, Redis, API, and load-test infrastructure is removed.
- [x] Root scripts describe and run the local-only workflow.
- [x] Generated JavaScript duplicates are removed and do not reappear.
- [x] Fresh install, lint, typecheck, tests, and build pass.
- [x] `pnpm dev` starts one frontend process without Docker.
- [x] Documentation matches the actual commands.
- [x] Verification evidence and changed-file inventory are complete.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-06-08 | Remove the frontend Dockerfile and nginx configuration with the backend stack. | The target is a static PWA hosted from a stable HTTPS origin; Phase 5 owns that deployment design. | Phase 3 leaves no container-based runtime path. |
| 2026-06-08 | Keep Turbo for dependency-ordered validation while making `pnpm dev` a direct web command. | The two-package workspace still benefits from ordered builds without needing a multi-process development command. | Development starts one Vite process; validation remains workspace-aware. |
| 2026-06-08 | Treat all tracked JavaScript under `apps/web/src` as generated residue. | The application source is TypeScript and the files duplicate current or removed TypeScript modules. | Delete the twins and set web TypeScript to `noEmit`. |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| 2026-06-08 | Remove the API directory in one filesystem operation. | Tracked API contents were removed, then the remaining empty directory was removed after stopping an old API process that held it open. | Windows prevented deletion while the process retained the directory handle. | None; no API process or backend listener remains. |
| 2026-06-08 | Keep changes limited to workspace and infrastructure cleanup. | Removed an unused `STARTING_FEN` constant from the chess engine. | The newly comprehensive root lint command exposed this pre-existing error. | None; engine behavior and tests are unchanged. |

## Blockers And Failed Approaches

| Date | Issue or attempt | Outcome | Resolution or owner |
| --- | --- | --- | --- |
| 2026-06-08 | Phase 2 ESLint was blocked by four generated `.js` twins containing stale rule suppressions. | Retained TypeScript passed typecheck and browser tests, but whole-source lint could not pass. | Phase 3 deletes all generated source-adjacent JavaScript and prevents TypeScript from recreating it. |
| 2026-06-08 | An old `apps/api` Node process and compiler helper were still running. | The backend directory could not be removed completely on the first attempt. | Stopped the two project backend processes, removed the empty directory, and confirmed no backend listener remains. |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| 2026-06-08 | `pnpm install --lockfile-only --ignore-scripts` | Passed; lockfile reduced to the root, web, and chess-engine importers. |
| 2026-06-08 | `pnpm install --frozen-lockfile` | Passed; lockfile was current and the two-package workspace installed without backend tooling. |
| 2026-06-08 | `pnpm list -r --depth -1` | Passed; only web and chess-engine workspace packages remain beneath the root. |
| 2026-06-08 | `pnpm lint` | Passed across web and chess engine; Phase 2 generated-JavaScript residue resolved. |
| 2026-06-08 | `pnpm typecheck` | Passed across both packages. |
| 2026-06-08 | `pnpm test` | Passed; 13 chess-engine tests. |
| 2026-06-08 | `pnpm build` twice | Passed; both builds produced `apps/web/dist`, created zero source `.js` files, and changed no tracked state. |
| 2026-06-08 | `pnpm test:e2e` | Passed; 78 desktop Chromium and landscape-tablet tests, including the no-backend network audit. |
| 2026-06-08 | Duplicate `pnpm dev` with port 5173 occupied | Exited with code 1 and `Port 5173 is already in use`; listener count remained exactly one. |
| 2026-06-08 | Backend/dependency/source searches | Passed; no retained runtime dependency references API, shared-types, database, Redis, Docker, Socket.IO, or backend port 3001. |

### Runtime And Visual Evidence

| Date | Evidence | Artifact or notes | Result |
| --- | --- | --- | --- |
| 2026-06-08 | Desktop setup | `evidence/phase-3/desktop-setup.png` | Passed. |
| 2026-06-08 | Desktop game | `evidence/phase-3/desktop-game.png` | Passed with all character pieces visible. |
| 2026-06-08 | Landscape tablet game | `evidence/phase-3/tablet-landscape-game.png` | Passed at 1280x800. |
| 2026-06-08 | Runtime listeners | One Vite listener on `127.0.0.1:5173`; no API, PostgreSQL, or Redis listener required by the project. | Passed. |

### Changed Files

- Added: Phase 3 verification screenshots.
- Modified: root scripts, workspace definition, lockfile, web TypeScript/build
  configuration, CI workflow, README, chess-engine lint cleanup, and checkpoint.
- Deleted: API workspace, shared network-types workspace, load tests, Docker
  Compose, frontend/backend container files, nginx configuration, backend
  environment/security material, and all generated JavaScript under web source.

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| 2026-06-08 | In Progress | Phase 3 started from the completed Phase 2 working tree; baseline infrastructure and generated-file inventory recorded. |
| 2026-06-08 | In Progress | Backend workspaces, load tests, containers, generated source JavaScript, and obsolete scripts removed. |
| 2026-06-08 | Verified | Frozen install, lint, typecheck, tests, two clean builds, duplicate-listener check, and 78 E2E tests passed. |
| 2026-06-08 | Complete | Acceptance criteria passed; Phase 4 unlocked. |

## Next Handoff

- Final commit: `3a2d19a`.
- Remaining known risks: PWA hosting, offline caching, and IndexedDB persistence
  are intentionally deferred to Phases 4 and 5.
- Important decisions: Turbo remains for two-package validation; `pnpm dev`
  directly starts one strict-port Vite process; container deployment is removed.
- Verified commands: frozen install, workspace listing, lint, typecheck, unit
  tests, two production builds, E2E, duplicate listener, source/dependency audit.
- Phase 4 may begin: Yes
