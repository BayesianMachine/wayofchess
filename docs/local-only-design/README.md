# Local-Only Implementation Checkpoints

This directory is the durable implementation record for the local-only release.
Start with [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md), then execute the phase
documents in numerical order.

All implementation work is integrated into `main`. This directory now serves as
the historical decision record and release-verification checklist.

## Phase Documents

1. [Phase 1 - Establish Boundaries](./PHASE_1_ESTABLISH_BOUNDARIES.md)
2. [Phase 2 - Remove Non-Local Features](./PHASE_2_REMOVE_NON_LOCAL_FEATURES.md)
3. [Phase 3 - Simplify The Workspace](./PHASE_3_SIMPLIFY_WORKSPACE.md)
4. [Phase 4 - Add Offline Persistence](./PHASE_4_OFFLINE_PERSISTENCE.md)
5. [Phase 5 - Build And Deploy The PWA](./PHASE_5_BUILD_DEPLOY_PWA.md)
6. [Phase 6 - Verify The Product](./PHASE_6_VERIFY_PRODUCT.md)

## Current Release State

| Phase | State | Integrated commit |
| --- | --- | --- |
| 1-2 | Complete | `c35584d` |
| 3 | Complete | `3a2d19a` |
| 4 | Complete | `c7de7e5` |
| 5 | Complete; physical Android release evidence transferred to Phase 6 | `1c4dacb` |
| 6 | Automated verification complete; physical Android gate pending | `fe8329e` |

No Phase 7 scope has been approved. APK packaging remains a separate future
project rather than an implied continuation of this release.

## Checkpoint Protocol

Each implementing LLM must update the active phase document while working.

1. Change `Status` to `In Progress` and add a dated progress-log entry.
2. Complete checklist items incrementally; do not mark unfinished work complete.
3. Record meaningful implementation choices under `Decisions`.
4. Record departures from the plan under `Deviations`, including the reason and
   effect on later phases.
5. Record blockers and failed approaches instead of erasing that context.
6. Add commands, results, screenshots, and changed files to `Verification Evidence`.
7. Evaluate every acceptance criterion before marking the phase complete.
8. Set `Status` to `Complete` only when every acceptance criterion passes.
9. Fill in `Next Handoff` with the state the next phase needs.
10. Continue automatically to the next phase after the acceptance gate passes.

## Status Values

- `Not Started`
- `In Progress`
- `Blocked`
- `Complete`

## Evidence Rules

- Use exact commands and concise result summaries.
- Include failed tests and their disposition.
- Link screenshots or artifacts using repository-relative paths.
- List changed, added, moved, and deleted files.
- Note tests that could not be run and why.
- Do not claim manual Android verification without testing a real Android device.

## Change Discipline

- The architecture plan defines intent; phase documents define execution.
- New information may change implementation details.
- A deviation must preserve the phase goal or explicitly update the architecture
  plan when the goal itself changes.
- Preserve unrelated user changes.
- Keep the application runnable at each completed phase boundary.

