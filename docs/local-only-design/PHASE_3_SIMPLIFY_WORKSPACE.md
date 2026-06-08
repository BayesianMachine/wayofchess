# Phase 3 - Simplify The Workspace

**Status:** Not Started  
**Depends on:** Phase 2 complete  
**Unlocks:** Phase 4 - Add Offline Persistence

## Objective

Remove server-only packages and orchestration, reduce the workspace to the web
application and chess engine, and establish one predictable local development
process.

## Work Checklist

### Pre-Removal Audit

- [ ] Confirm the web app has no imports from `apps/api` or `packages/shared-types`.
- [ ] Confirm no retained test depends on PostgreSQL, Redis, API, or sockets.
- [ ] Record all root scripts and CI jobs before changing them.
- [ ] Inventory Docker, Kubernetes, deployment, load-test, and backend environment files.
- [ ] Verify all deletions remain recoverable from `main` and Git history.

### Workspace Reduction

- [ ] Remove `apps/api`.
- [ ] Remove `packages/shared-types`.
- [ ] Update `pnpm-workspace.yaml`.
- [ ] Update root TypeScript/project references if present.
- [ ] Regenerate the lockfile using the repository package manager.
- [ ] Confirm only intended workspaces remain discoverable.

### Infrastructure Removal

- [ ] Remove Docker Compose configuration.
- [ ] Remove API/database/Redis Dockerfiles and configuration.
- [ ] Remove Kubernetes manifests and backend deployment files.
- [ ] Remove network load tests.
- [ ] Remove backend-only environment templates and secrets documentation.
- [ ] Retain only static-host/PWA deployment material justified by Phase 5.

### Scripts And CI

- [ ] Make root `pnpm dev` start exactly one Vite frontend.
- [ ] Make root `pnpm build` build the web app and required chess-engine package.
- [ ] Simplify lint, typecheck, test, and clean scripts.
- [ ] Remove API and service-container CI jobs.
- [ ] Keep web, chess-engine, and browser-test CI coverage.
- [ ] Update README setup and development commands.

### Generated File Cleanup

- [ ] Identify `.js` files emitted beside `.ts` or `.tsx` source files.
- [ ] Distinguish generated siblings from intentional JavaScript configuration.
- [ ] Delete only confirmed generated duplicates.
- [ ] Configure TypeScript builds to prevent in-place emission.
- [ ] Add ignore rules for generated output directories where needed.
- [ ] Run the build twice and confirm the source tree remains clean.

### Duplicate Process Prevention

- [ ] Document the single supported start command.
- [ ] Remove scripts that silently start Docker or multiple app stacks.
- [ ] Ensure Vite fails clearly or selects an intentional port when one is occupied.
- [ ] Document how to identify and stop an existing local Vite process.

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

- [ ] Workspace contains only the web app and chess engine as executable packages.
- [ ] Docker, Kubernetes, database, Redis, API, and load-test infrastructure is removed.
- [ ] Root scripts describe and run the local-only workflow.
- [ ] Generated JavaScript duplicates are removed and do not reappear.
- [ ] Fresh install, lint, typecheck, tests, and build pass.
- [ ] `pnpm dev` starts one frontend process without Docker.
- [ ] Documentation matches the actual commands.
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
- Remaining known risks:
- Important decisions:
- Verified commands:
- Phase 4 may begin: No

