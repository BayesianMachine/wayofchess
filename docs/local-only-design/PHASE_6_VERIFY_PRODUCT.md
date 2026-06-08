# Phase 6 - Verify The Product

**Status:** Not Started  
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

- [ ] Start from a clean checkout and fresh dependency install.
- [ ] Confirm `pnpm dev` starts exactly one Vite frontend.
- [ ] Confirm Docker and backend services are not required.
- [ ] Run lint, typecheck, unit, integration, E2E, and production build.
- [ ] Run the offline-build verifier.
- [ ] Confirm the source tree stays clean after build and tests.

### Gameplay

- [ ] Start games with every supported time control.
- [ ] Verify legal and illegal moves.
- [ ] Verify captures, castling, en passant, check, and checkmate.
- [ ] Verify promotion through touch controls.
- [ ] Verify draw offer/acceptance behavior.
- [ ] Verify white and black resignation.
- [ ] Verify clock increments and timeouts.
- [ ] Verify reset/new-game behavior.
- [ ] Verify move history and game-over messaging.

### Persistence And History

- [ ] Close and reopen during an active game.
- [ ] Resume and discard recovered games.
- [ ] Background Chrome and verify elapsed clock deduction.
- [ ] Close Chrome long enough to cause a timeout and verify the result.
- [ ] Complete multiple games and verify full retained history.
- [ ] Delete one history item and verify others remain.
- [ ] Export, reset, import, and compare restored data.
- [ ] Run migration from a previous database fixture.
- [ ] Verify corrupt backup and database records fail safely.

### Offline PWA

- [ ] Install from the stable HTTPS URL in Chrome.
- [ ] Confirm standalone launch and landscape orientation.
- [ ] Wait for the offline-ready state.
- [ ] Enable airplane mode and cold-launch the installed app.
- [ ] Play and complete a full game offline.
- [ ] Verify all Mandalorian pieces, fonts, icons, and styles offline.
- [ ] Confirm no API or WebSocket request occurs.
- [ ] Reconnect and verify controlled update discovery.
- [ ] Update during an idle state and verify preserved data.
- [ ] Attempt update during an active game and verify no interruption.

### Tablet Touch And Layout

- [ ] Verify tap-select and tap-move.
- [ ] Verify drag is optional, not required.
- [ ] Verify all touch targets are at least 44 by 44 CSS pixels.
- [ ] Verify the board and primary controls fit without page scrolling.
- [ ] Verify no hover-only controls.
- [ ] Verify long-press and text selection do not disrupt board play.
- [ ] Verify Android browser/system UI does not cover controls.
- [ ] Verify portrait mode presents the intended rotate experience.
- [ ] Verify reduced-motion behavior.
- [ ] Capture screenshots at each representative landscape viewport.

### Regression And Removal Audit

- [ ] Search for auth, account, profile, rating, matchmaking, spectator, AI, API, and socket remnants.
- [ ] Confirm removed routes redirect safely.
- [ ] Confirm documentation contains no obsolete Docker/backend startup instructions.
- [ ] Confirm package and lock files contain no unjustified server dependencies.
- [ ] Confirm browser console has no unexplained errors or warnings.

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
- [ ] Every prior phase is marked `Complete`.
- [ ] Automated checks pass from a clean checkout.
- [ ] A full game is completed on a real Android tablet in airplane mode.
- [ ] Active-game recovery and elapsed-clock handling pass on the tablet.
- [ ] Completed history, export, import, and migration pass.
- [ ] A PWA update preserves the active game and complete history.
- [ ] No non-local feature or runtime server dependency remains.
- [ ] No unresolved release-blocking accessibility, layout, or console issue remains.
- [ ] Release evidence and known residual risks are documented.

## Defect Policy

- Release-blocking defects keep this phase `In Progress` or `Blocked`.
- Non-blocking defects must have a documented issue, severity, and workaround.
- A skipped required Android check prevents phase completion.

## Decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| TBD |  |  |  |

## Deviations

| Date | Planned approach | Actual approach | Reason | Follow-up |
| --- | --- | --- | --- | --- |
| TBD |  |  |  |  |

## Blockers And Defects

| Date | Severity | Issue | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| TBD |  |  |  |  |

## Verification Evidence

### Commands And Results

| Date | Command | Result |
| --- | --- | --- |
| TBD |  |  |

### Android Device Evidence

| Date | Device | Android/Chrome | Scenario | Artifact | Result |
| --- | --- | --- | --- | --- | --- |
| TBD |  |  |  |  |  |

### Release Artifacts

- Production URL:
- Release version:
- Commit:
- Test report:
- Screenshots:
- Backup/migration fixtures:

### Changed Files

- Added:
- Modified:
- Deleted:

## Progress Log

| Timestamp | Status | Update |
| --- | --- | --- |
| TBD | Not Started | Phase document created. |

## Final Handoff

- Release status:
- Released commit/version:
- Production URL:
- Known residual risks:
- Deferred work:
- APK phase notes:
- Local-only release complete: No

