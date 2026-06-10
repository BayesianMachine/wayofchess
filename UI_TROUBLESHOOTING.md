# UI Troubleshooting Memory

This document is the project's durable memory for UI incidents. Update it when
a UI problem takes more than one attempt, reveals a misleading test, or exposes
a reusable debugging lesson.

## Evidence-First Protocol

Follow the rendering path before changing code:

1. Reproduce the issue in the live browser.
2. Inspect the rendered DOM or accessibility snapshot.
3. Identify the exact component and branch producing that DOM.
4. Inspect values at runtime, especially imported assets and configuration.
5. Inspect the transformed module served by Vite when build-time behavior is
   uncertain.
6. Form one falsifiable root-cause hypothesis.
7. Make the smallest fix at the proven failure point.
8. Verify in three layers:
   - Static: typecheck and build.
   - Runtime: live DOM contains the intended elements.
   - Visual: screenshot confirms the intended appearance.
9. Record the incident below.

Do not treat a successful typecheck or build as proof that the browser rendered
the intended branch. Do not restart servers or clear caches unless evidence
shows stale code is being served.

## Incident Template

Copy this block for future incidents:

```md
### YYYY-MM-DD: Short title

- Symptom:
- Runtime evidence:
- Misleading signals:
- Root cause:
- Fix:
- Verification:
- Prevention:
```

## Incident Memory

### 2026-06-08: Character SVGs Fell Back to Unicode Chess Pieces

- Symptom: Custom Mandalorian and Imperial SVG files existed, but the board
  continued to display standard Unicode chess glyphs.
- Runtime evidence: The live DOM contained `♜`, `♟`, `♔`, and related glyphs.
  Vite served each `*.svg?react` import as a URL string rather than a component.
- Misleading signals: TypeScript and production builds passed because
  `vite-env.d.ts` incorrectly declared `*.svg?react` as a React component.
  Replacing SVG artwork and restarting Vite could not affect the active branch.
- Root cause: `vite-plugin-svgr` was not installed or configured.
  `PieceComponent` checked `typeof Svg === 'function'`, received a string, and
  intentionally selected its Unicode fallback.
- Fix: Import SVGs as ordinary Vite asset URLs and render them with `<img>`.
  Remove the inaccurate `*.svg?react` declaration.
- Verification: Confirm custom piece `<img>` elements in the live DOM, confirm
  Unicode glyphs are absent for known pieces, inspect a browser screenshot, then
  run typecheck and production build.
- Prevention: Before changing visual assets, prove that the intended rendering
  branch executes and inspect the runtime type of transformed asset imports.

### 2026-06-10: Touch Promotion Bypassed the Promotion Dialog

- Symptom: Ordinary tap-to-move worked, but moving a pawn to the final rank on a
  touch viewport did not open the promotion choices.
- Runtime evidence: A seeded legal promotion position selected the pawn, but
  tapping the destination produced no move and no promotion dialog at three
  landscape viewport sizes.
- Misleading signals: Engine promotion tests passed, mouse-oriented board tests
  passed, and ordinary pawn taps worked. Those signals did not exercise the
  touch destination through the promotion UI.
- Root cause: Tap destinations called the game store directly. The store tried
  to submit the move without a promotion piece, while the promotion dialog
  existed only in the board's separate move path.
- Fix: Give the board's 64 square buttons sole ownership of tap and drag
  interaction, make piece artwork presentation-only, and route every legal
  destination through the board move pipeline.
- Verification: Seed a replay-valid promotion position through backup import,
  tap the source and destination using Playwright touchscreen input, select a
  promotion piece, and assert the resulting SAN at 1024x600, 1280x800, and
  1366x768.
- Prevention: A visual layer should not compete with its interaction layer.
  Test rule-specific UI with the actual input modality, not only at the engine
  or store level.
