# Phase 5 - Build And Deploy The PWA

**Status:** Not Started  
**Depends on:** Phase 4 complete  
**Unlocks:** Phase 6 - Verify The Product

## Objective

Turn the local web application into an installable Chrome PWA hosted at one
stable HTTPS origin. Precache every gameplay asset, support deliberate atomic
updates, and preserve IndexedDB records across releases.

## Work Checklist

### Hosting Decision

- [ ] Select the static HTTPS hosting provider.
- [ ] Record the permanent production origin.
- [ ] Confirm TLS, SPA fallback, cache-header, and atomic-deploy support.
- [ ] Confirm deployments do not change the origin.
- [ ] Document deployment credentials and ownership outside this repository.

### Manifest And Installation

- [ ] Add `manifest.webmanifest`.
- [ ] Set stable app name, short name, start URL, scope, and application ID.
- [ ] Configure standalone display and landscape orientation.
- [ ] Add theme and background colors.
- [ ] Add required Android icon sizes, including maskable icons.
- [ ] Add manifest and installability validation.
- [ ] Verify Chrome exposes the install action.

### Service Worker

- [ ] Choose and document generated or custom service-worker tooling.
- [ ] Precache HTML, JavaScript, CSS, fonts, pieces, icons, and required media.
- [ ] Use versioned cache names.
- [ ] Provide an offline navigation fallback.
- [ ] Avoid caching API behavior because no application API remains.
- [ ] Delete obsolete caches only after the new release activates safely.
- [ ] Expose an offline-ready event to the application.
- [ ] Add a visible but unobtrusive offline-ready state.

### Update Lifecycle

- [ ] Detect a waiting service worker.
- [ ] Show an explicit update-ready action.
- [ ] Do not force an update during an active game.
- [ ] Checkpoint active state before activating an update.
- [ ] Activate and reload only after user confirmation or a safe idle state.
- [ ] Run IndexedDB migrations after the new release loads.
- [ ] Recover the prior game if update or migration fails.
- [ ] Test old-to-new release transitions.

### Offline Build Verification

- [ ] Add `tools/verify-offline-build.mjs`.
- [ ] Verify every generated local asset reference exists.
- [ ] Fail on remote fonts, CDNs, analytics, or runtime gameplay dependencies.
- [ ] Validate manifest paths and service-worker scope.
- [ ] Confirm all Mandalorian assets are in the precache.
- [ ] Add the check to local scripts and CI.

### Deployment And User Instructions

- [ ] Deploy the production build to the permanent HTTPS origin.
- [ ] Test first-load installation in Chrome.
- [ ] Test launch after switching to airplane mode.
- [ ] Test update discovery after reconnecting.
- [ ] Test history and active-game preservation across deployment.
- [ ] Document installation, offline-ready, update, backup, and restore steps.
- [ ] Prepare the stable URL that will be emailed to recipients.
- [ ] Record APK packaging as a separate future project.

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

- [ ] PWA installs from current Chrome on Android.
- [ ] Installed app opens in standalone landscape mode.
- [ ] Complete gameplay works in airplane mode after installation.
- [ ] Every required asset is precached and verified.
- [ ] The stable HTTPS origin preserves IndexedDB across deployments.
- [ ] Updates never interrupt an active game.
- [ ] An old complete release remains usable until the new one is ready.
- [ ] Active game and history survive an application update.
- [ ] CI validates the offline production build.
- [ ] Installation and update documentation matches tested behavior.
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

### Deployment And Device Evidence

| Date | Release/URL | Device/browser | Artifact | Result |
| --- | --- | --- | --- | --- |
| TBD |  |  |  |  |

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
- Production URL:
- Released build/version:
- Service-worker/cache version:
- Remaining known risks:
- Verified commands:
- Phase 6 may begin: No

