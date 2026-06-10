# Phase 6 - Verify The Product

**Status:** In Progress
**Substatus:** Physical Android verification pending
**Depends on:** Phase 5 complete  
**Unlocks:** Local-only release

## Objective

Perform release-level verification of the complete local-only product across
gameplay, persistence, offline PWA behavior, updates, landscape touch UX, and
the simplified development workflow.

## Test Environments

At minimum:

- Desktop Chrome for development diagnostics
- Current Google Chrome on a real Android tablet
- Multiple representative landscape viewport sizes in browser automation
- Online, offline, backgrounded, closed, and update-transition states

Device model is not a product dependency, but actual device and Android version
must be recorded with evidence.

## Work Checklist

### Repository And Development Workflow

- [x] Start from a clean checkout and fresh dependency install.
- [x] Confirm `pnpm dev` starts exactly one Vite frontend.
- [x] Confirm Docker and backend services are not required.
- [x] Run lint, typecheck, unit, integration, E2E, and production build.
- [x] Run the offline-build verifier.
- [x] Confirm the source tree stays clean after build and tests.

### Gameplay

- [x] Start games with every supported time control.
- [x] Verify legal and illegal moves.
- [x] Verify captures, castling, en passant, check, and checkmate.
- [x] Verify promotion through touch controls.
- [x] Verify draw offer/acceptance behavior.
- [x] Verify white and black resignation.
- [x] Verify clock increments and timeouts.
- [x] Verify reset/new-game behavior.
- [x] Verify move history and game-over messaging.

### Persistence And History

- [x] Close and reopen during an active game.
- [x] Resume and discard recovered games.
- [x] Background Chrome and verify elapsed clock deduction.
- [x] Close Chrome long enough to cause a timeout and verify the result.
- [x] Complete multiple games and verify full retained history.
- [x] Delete one history item and verify others remain.
- [x] Export, reset, import, and compare restored data.
- [x] Run migration from a previous database fixture.
- [x] Verify corrupt backup and database records fail safely.

### Offline PWA

- [ ] Install from the stable HTTPS URL in Chrome.
- [ ] Confirm standalone launch and landscape orientation.
- [x] Wait for the offline-ready state.
- [ ] Enable airplane mode and cold-launch the installed app.
- [x] Play and complete a full game offline in automated Chromium.
- [x] Verify all Mandalorian pieces, fonts, icons, and styles offline.
- [x] Confirm no API or WebSocket request occurs.
- [x] Reconnect and verify controlled update discovery.
- [x] Update during an idle state and verify preserved data.
- [x] Attempt update during an active game and verify no interruption.

### Tablet Touch And Layout

- [x] Verify tap-select and tap-move.
- [x] Verify drag is optional, not required.
- [x] Verify all touch targets are at least 44 by 44 CSS pixels.
- [x] Verify the board and primary controls fit without page scrolling.
- [x] Verify no hover-only controls.
- [x] Verify long-press and text selection do not disrupt board play.
- [ ] Verify Android browser/system UI does not cover controls.
- [x] Verify portrait mode presents the intended rotate experience.
- [x] Verify reduced-motion behavior.
- [x] Capture screenshots at each representative landscape viewport.

### Regression And Removal Audit

- [x] Search for auth, account, profile, rating, matchmaking, spectator, AI, API, and socket remnants.
- [x] Confirm removed routes redirect safely.
- [x] Confirm documentation contains no obsolete Docker/backend startup instructions.
- [x] Confirm package and lock files contain no unjustified server dependencies.
- [x] Confirm browser console has no unexplained errors or warnings.

## Release Evidence Matrix

| Area | Automated | Manual desktop | Android device | Required artifact |
| --- | --- | --- | --- | --- |
| Build and static analysis | Yes | No | No | Command results |
| Chess rules | Yes | Spot check | Spot check | Test report |
| Local workflow | Yes | Yes | Yes | E2E and screenshots |
| Persistence | Yes | Yes | Yes | Tests and device notes |
| Offline PWA | Partial | Yes | Yes | Network evidence/screenshots |
| Update lifecycle | Yes where possible | Yes | Yes | Version transition record |
| Touch/layout | Viewports | Optional | Yes | Screenshots |

## Release Acceptance Criteria

- [ ] Every acceptance criterion in the architecture plan passes.
- [x] Every prior phase is marked `Complete`.
- [x] Automated checks pass from a clean checkout.
- [ ] A full game is completed on a real Android tablet in airplane mode.
- [ ] Active-game recovery and elapsed-clock handling pass on the tablet.
- [x] Completed history, export, import, and migration pass.
- [x] A PWA update preserves the active game and complete history.
- [x] No non-local feature or runtime server dependency remains.
- [x] No unresolved release-blocking automated accessibility, layout, or console issue remains.
- [x] Release evidence and known residual risks are documented.

## Defect Policy

- Release-blocking defects keep this phase `In Progress` or `Blocked`.
- Non-blocking defects must have a documented issue, severity, and workaround.
- A skipped required Android check prevents phase completion.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-06-10 | Treat physical Android checks as a mandatory final gate, not something emulation can satisfy. | Browser automation cannot prove Chrome installation UI, Android system overlays, or a real airplane-mode launch. | Phase remains open until device evidence is recorded. |
| 2026-06-10 | Verify 1024x600, 1280x800, and 1366x768 landscape viewports. | These cover compact and common Android tablet display shapes and scaling pressure. | Each viewport has touch, fit, target-size, promotion, portrait, and reduced-motion coverage. |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| 2026-06-10 | Phase 5 was not marked fully complete before Phase 6 began. | The user explicitly continued while physical Android verification remained. | Phase 6 automated work proceeded; the shared physical-device gate still prevents final release completion. |

## Blockers And Defects

| Date | Severity | Issue | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| 2026-06-10 | High | Tap promotion bypassed the promotion dialog because the store attempted a promotion move without a selected piece type. | New touchscreen promotion test failed at all three landscape sizes. | Unified tap and drag destinations through the board move pipeline; test now passes. |
| 2026-06-10 | Medium | Gameplay scrolled by 20px at compact landscape sizes. | New viewport-fit assertion failed at 1024x600, 1280x720, and 1366x768. | Constrained the game layout to `100dvh` and resized the board against available vertical space. |
| 2026-06-10 | Medium | Small controls were below the 44px touch-target minimum. | Bounding-box audit of visible setup controls. | Added 44px minimum dimensions to shared and time-control buttons. |
| 2026-06-10 | Medium | Root `DEPLOYMENT.md` documented removed API, Docker, database, Redis, and WebSocket infrastructure. | Repository removal audit. | Deleted the obsolete document. |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| 2026-06-10 | `pnpm lint` and `pnpm typecheck` | Passed for web and chess engine. |
| 2026-06-10 | `pnpm test` | Passed: 15 web tests and 13 chess-engine tests. |
| 2026-06-10 | `pnpm test:e2e` | Passed: 101 desktop, tablet, navigation, persistence, and release tests. |
| 2026-06-10 | `pnpm test:pwa` | Passed: offline completion/assets and two-release deferred update preservation. |
| 2026-06-10 | `pnpm build` twice and `pnpm verify:offline` | Passed: 28-entry precache, 12 character assets, four icons, no source-adjacent JavaScript. |
| 2026-06-10 | Duplicate `pnpm dev` with port 5173 occupied | Failed clearly with `Port 5173 is already in use`; listener count remained one. |
| 2026-06-10 | Regression/removal searches | No runtime auth, server, Docker, API, socket, database, or AI dependency remained. |
| 2026-06-10 | Detached clean worktree plus `pnpm install --frozen-lockfile` | Passed from commit `da3d491`; 589 packages installed from the lockfile. |
| 2026-06-10 | Complete validation in detached clean worktree | Passed lint, typecheck, 28 tests, two builds, offline verification, 101 E2E tests, and two PWA scenarios; Git status stayed clean. |
| 2026-06-10 | Clean-worktree process audit | One Vite listener started on `127.0.0.1:5173`; duplicate startup exited 1 and listener count remained one. |
| 2026-06-10 | GitHub CI run `27245954146` | Passed for the reconciled Phase 6 release candidate. |
| 2026-06-10 | GitHub Pages run `27245954150` | Passed; the published bundle returned HTTP 200 and contained the Phase 6 commit version. |

### Android Device Evidence

| Date | Device | Android/Chrome | Scenario | Artifact | Result |
| --- | --- | --- | --- | --- | --- |
| TBD |  |  |  |  |  |

### Release Artifacts

- Production URL: <https://bayesianmachine.github.io/wayofchess/>
- Release version: Phase 6 release candidate from this commit, deployed to Pages.
- Commit: `fe8329e` for the Phase 6 implementation and automated evidence.
- Test report: 28 unit/engine tests, 101 E2E tests, and two PWA scenarios passed.
- Screenshots: `evidence/phase-6/game-1024x600.png`,
  `game-1280x800.png`, and `game-1366x768.png`.
- Backup/migration fixtures: generated in persistence unit tests and the
  touchscreen promotion release test.

### Changed Files

- Added: landscape guard, clock-store tests, release verification spec, and
  three landscape evidence screenshots.
- Modified: board interaction/sizing, game layout, setup/shared controls,
  Playwright projects, and offline completion coverage.
- Deleted: obsolete root `DEPLOYMENT.md`.

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| 2026-06-10 | In Progress | Began the release audit with the Phase 5 physical-device gate still open. |
| 2026-06-10 | Defects Found | Found obsolete infrastructure docs, landscape overflow, small touch targets, and broken touch promotion. |
| 2026-06-10 | Automated Verification Complete | All local automated release checks pass; clean-checkout rerun and physical Android evidence remain. |
| 2026-06-10 | Clean Verification Complete | Frozen install and every automated gate passed in a detached clean worktree. |
| 2026-06-10 | Deployed | CI and GitHub Pages passed, and the public production bundle contains the Phase 6 release candidate. |

## Final Handoff

- Release status: Release candidate; physical Android verification required.
- Released commit/version: `fe8329e`, deployed to Pages; the subsequent
  documentation reconciliation does not change application behavior.
- Production URL: <https://bayesianmachine.github.io/wayofchess/>
- Known residual risks: Chrome install UI, Android system-UI overlap, standalone
  landscape enforcement, and airplane-mode cold launch remain unverified on a
  physical device.
- Deferred work: APK packaging remains a separate phase.
- APK phase notes: Reuse the static PWA build and IndexedDB model in a future
  Android wrapper; do not introduce a backend dependency.
- Local-only release complete: No

