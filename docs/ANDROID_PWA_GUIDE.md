# The Way of Chess - Android PWA Guide

## Install

1. Connect the tablet to the internet.
2. Open <https://bayesianmachine.github.io/wayofchess/> in Google Chrome.
3. Keep the page open until **Ready for offline play** appears.
4. Open Chrome's menu and choose **Install app** or **Add to Home screen**.
5. Launch **The Way of Chess** from its home-screen icon and rotate to landscape.
6. Enable airplane mode and reopen the installed app to confirm offline launch.

Do not email or open the generated static folder directly. The stable HTTPS
address is what keeps installation, updates, and IndexedDB history attached to
one browser origin.

## Updates

Reconnect the tablet and open the installed app. A downloaded release displays
**A new version is ready** with **Apply Update**. During an active game, the app
shows **Update available after this game** and does not permit activation.

Finish or discard the active game, choose **Apply Update**, and allow the app to
reload. Existing game history remains in IndexedDB.

## Backup And Restore

From setup, open **Backup & Data**:

- **Export Backup** downloads a versioned JSON copy of the active game, clocks,
  preferences, and complete history.
- **Import Backup** validates the entire file before merging it.
- **Reset Local Data** permanently clears local game data after confirmation.

Email or otherwise transfer the exported JSON file when moving history between
devices. Export before clearing Chrome storage, uninstalling the app, or
factory-resetting the tablet.

## Troubleshooting

- No install action: verify the page uses HTTPS, reload once, and wait for the
  offline-ready confirmation.
- App does not work in airplane mode: reconnect, open the app, wait for offline
  readiness, then retry.
- Update does not appear: reconnect and reopen the app. Chrome also checks
  periodically while it remains open.
- Storage warning: export a backup. Chrome may evict site data when device
  storage is under pressure.
- Missing history after using another URL: return to the exact production URL
  above. Browser storage is isolated by origin.

APK packaging is intentionally outside this release and remains a separate
future project.
