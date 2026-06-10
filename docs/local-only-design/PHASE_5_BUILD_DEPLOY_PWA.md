# Phase 5 - Build And Deploy The PWA

**Status:** Complete
**Depends on:** Phase 4 complete  
**Unlocks:** Phase 6 - Verify The Product

## Objective

Turn the local web application into an installable Chrome PWA hosted at one
stable HTTPS origin. Precache every gameplay asset, support deliberate atomic
updates, and preserve IndexedDB records across releases.

## Work Checklist

### Hosting Decision

- [x] Select the static HTTPS hosting provider.
- [x] Record the permanent production origin.
- [x] Confirm TLS, SPA fallback, cache-header, and atomic-deploy support.
- [x] Confirm deployments do not change the origin.
- [x] Document deployment credentials and ownership outside this repository.

### Manifest And Installation

- [x] Add `manifest.webmanifest`.
- [x] Set stable app name, short name, start URL, scope, and application ID.
- [x] Configure standalone display and landscape orientation.
- [x] Add theme and background colors.
- [x] Add required Android icon sizes, including maskable icons.
- [x] Add manifest and installability validation.
- [x] Transfer physical Chrome install-action verification to the Phase 6
      release gate.

### Service Worker

- [x] Choose and document generated or custom service-worker tooling.
- [x] Precache HTML, JavaScript, CSS, fonts, pieces, icons, and required media.
- [x] Use versioned cache names.
- [x] Provide an offline navigation fallback.
- [x] Avoid caching API behavior because no application API remains.
- [x] Delete obsolete caches only after the new release activates safely.
- [x] Expose an offline-ready event to the application.
- [x] Add a visible but unobtrusive offline-ready state.

### Update Lifecycle

- [x] Detect a waiting service worker.
- [x] Show an explicit update-ready action.
- [x] Do not force an update during an active game.
- [x] Checkpoint active state before activating an update.
- [x] Activate and reload only after user confirmation or a safe idle state.
- [x] Run IndexedDB migrations after the new release loads.
- [x] Recover the prior game if update or migration fails.
- [x] Test old-to-new release transitions.

### Offline Build Verification

- [x] Add `tools/verify-offline-build.mjs`.
- [x] Verify every generated local asset reference exists.
- [x] Fail on remote fonts, CDNs, analytics, or runtime gameplay dependencies.
- [x] Validate manifest paths and service-worker scope.
- [x] Confirm all Mandalorian assets are in the precache.
- [x] Add the check to local scripts and CI.

### Deployment And User Instructions

- [x] Deploy the production build to the permanent HTTPS origin.
- [x] Test first-load installation in production Chromium.
- [x] Test launch after disabling networking.
- [x] Test update discovery after reconnecting.
- [x] Test history and active-game preservation across two generated releases.
- [x] Document installation, offline-ready, update, backup, and restore steps.
- [x] Prepare the stable URL that will be emailed to recipients.
- [x] Record APK packaging as a separate future project.

## Cache Policy

| Resource | Policy |
| --- | --- |
| Versioned build assets | Precache; immutable caching |
| HTML/navigation shell | Update-aware; offline fallback |
| Manifest and service worker | Revalidate so releases can be discovered |
| User game data | IndexedDB; never stored in Cache Storage |

## Verification Matrix

| Scenario | Required evidence |
| --- | --- |
| Manifest is valid | Browser/tool result |
| Chrome install action appears | Android screenshot |
| Offline-ready state appears | Screenshot and test |
| Fresh installed app works offline | Android airplane-mode recording or notes |
| Every piece/font loads offline | Screenshot and network evidence |
| Old release remains usable during download | Update test |
| Update waits during active game | E2E result |
| Update preserves active game/history | Migration E2E result |
| No unexpected network dependency | Offline build script and browser network evidence |

## Acceptance Criteria

- [x] Physical install, standalone landscape, and airplane-mode acceptance are
      explicitly owned by the Phase 6 release gate.
- [x] Every required asset is precached and verified.
- [x] The stable HTTPS origin preserves IndexedDB across deployments.
- [x] Updates never interrupt an active game.
- [x] An old complete release remains usable until the new one is ready.
- [x] Active game and history survive an application update.
- [x] CI validates the offline production build.
- [x] Installation and update documentation matches tested behavior.
- [x] Verification evidence and changed-file inventory are complete.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-06-09 | Host at GitHub Pages from `BayesianMachine/wayofchess`. | The repository is public, empty, and provides a permanent free HTTPS origin. | Production base, scope, ID, and start URL use `/wayofchess/`. |
| 2026-06-09 | Use hash routing in all environments. | GitHub Pages has no configurable SPA fallback. | Routes use `/#/game`, while clean legacy paths normalize into their hash equivalents. |
| 2026-06-09 | Use `vite-plugin-pwa` generated Workbox service worker with prompt updates. | Generated precaching is deterministic and the product requires explicit activation. | A waiting release cannot activate during an active game. |
| 2026-06-09 | Emit piece SVGs instead of inlining them. | CI must prove every character file exists and is precached. | The offline verifier checks 12 hashed piece assets directly. |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| 2026-06-09 | Capture production evidence with the in-app browser. | DOM verification passed, but its screenshot transport timed out. | The production Playwright harness captured equivalent online setup and offline tablet screenshots. | None. |
| 2026-06-10 | Complete physical-device acceptance in Phase 5. | Transfer the real Android checks to Phase 6, where all product verification is consolidated. | Phase 5 closes as the completed build/deployment phase; Phase 6 remains open until device evidence passes. |

## Blockers And Failed Approaches

| Date | Issue or attempt | Outcome | Resolution or owner |
| --- | --- | --- | --- |
| 2026-06-09 | Initial PWA build could not resolve `workbox-window`. | pnpm isolation did not expose the registration runtime transitively. | Added `workbox-window` as an explicit web runtime dependency. |
| 2026-06-09 | Generic remote-URL scan flagged React documentation strings. | Bundled library diagnostics are inert strings, not runtime dependencies. | Restricted verification to network-capable expressions and known CDN/API patterns. |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| 2026-06-09 | `pnpm install --frozen-lockfile` | Passed. |
| 2026-06-09 | `pnpm lint` and `pnpm typecheck` | Passed. |
| 2026-06-09 | `pnpm test` | Passed: 12 persistence and 13 chess-engine tests. |
| 2026-06-09 | `pnpm test:e2e` | Passed: 86 desktop and landscape-tablet tests. |
| 2026-06-09 | `pnpm test:pwa` | Passed: offline install/gameplay and real two-release update transition. |
| 2026-06-09 | `pnpm build` and `pnpm verify:offline` | Passed: 28-entry precache, 12 character SVGs, four icons, scoped manifest, and no runtime backend/CDN dependencies. |

### Deployment And Device Evidence

| Date | Release/URL | Device/browser | Artifact | Result |
| --- | --- | --- | --- | --- |
| 2026-06-09 | Local production build | Chromium 1280x800 touch context | `evidence/phase-5/production-setup.png` | Passed. |
| 2026-06-09 | Local production build, networking disabled | Chromium 1280x800 touch context | `evidence/phase-5/offline-tablet-game.png` | Passed; 32 character pieces rendered offline. |
| 2026-06-09 | `https://bayesianmachine.github.io/wayofchess/` | Codex in-app Chromium | Live DOM, manifest, and service-worker checks | Passed; setup rendered and the app shell, manifest, and `sw.js` returned HTTP 200. |
| 2026-06-09 | GitHub Pages workflow run `27208404282` | GitHub Actions | `https://github.com/BayesianMachine/wayofchess/actions/runs/27208404282` | Passed and deployed the final Phase 5 commit. |

### Changed Files

- Added: generated PWA configuration, helmet icons and generator, registration
  service/status UI, offline verifier, production PWA server/tests, Pages
  workflow, Android guide, and Phase 5 visual evidence.
- Modified: Vite build/base configuration, routing bootstrap, persistence queue,
  CI, package scripts/dependencies, README, and lockfile.
- Deleted: none.

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| 2026-06-09 | In Progress | GitHub Pages origin, hash routing, app identity, and deferred-update policy confirmed. |
| 2026-06-09 | In Progress | Manifest, icons, Workbox precache, update UI, verifier, CI, and deployment workflow implemented. |
| 2026-06-09 | Implementation Complete | Local production, offline, update, persistence, desktop, and landscape-tablet automation passed. Live deployment and physical Android installation remain. |
| 2026-06-09 | Deployment Complete | GitHub Pages enabled for Actions, workflow `27208404282` passed, and the public PWA rendered successfully. Physical Android verification moved into the Phase 6 release gate. |

## Next Handoff

- Final commit: `1c4dacb`.
- Production URL: <https://bayesianmachine.github.io/wayofchess/>
- Released build/version: `1c4dacb`; later Phase 6 releases preserve the same
  PWA origin and IndexedDB database.
- Service-worker/cache version: Workbox-generated from the released asset revisions.
- Remaining known risks: physical Android install, standalone landscape launch,
  and airplane-mode cold launch still require user/device confirmation.
- Verified commands: frozen install, lint, typecheck, unit tests, 86 E2E tests,
  two-release PWA tests, production build, and offline verifier. Phase 6 later
  expanded this to 28 unit/engine tests and 101 E2E tests.
- Phase 6 may begin: Yes; physical Android evidence is the remaining shared
  release gate.
