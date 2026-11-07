---
name: build-mac
description: Build the Komplett macOS desktop app locally (Apple silicon and Intel DMGs) from this Mac. Use when the user says "build mac", "build the mac version", "make the DMG", or "/build-mac".
---

# Build the Mac app

Runs the web build, then packages the Electron app for macOS into `release/`. Runs on this Mac only,
no GitHub involved. Windows is not built here; use `/build-desktop` for that.

## Steps

1. Check the `.env` file exists at the repo root with the four `VITE_FIREBASE_*` values. The build
   needs them. Don't print the values.
2. Build both Mac DMGs:
   ```bash
   pnpm electron:dist:mac
   ```
   This runs `pnpm build` then packages both `arm64` (Apple silicon) and `x64` (Intel) DMGs.
   Takes a few minutes on the first run because Electron is downloaded.
3. Confirm the outputs exist:
   ```bash
   ls -lh release/*.dmg
   ```
   Expect `Komplett-<version>-AppleSilicon.dmg` and `Komplett-<version>-Intel.dmg`.
4. Report the file paths to the user, with the sizes.

## Notes

- The app is not code-signed (no Developer ID identity on this machine), so macOS Gatekeeper warns
  on first launch. Right-click → Open to get past it.
- To build only one architecture, run `pnpm electron:dist:mac-silicon` or `pnpm electron:dist:mac-intel`.
- Don't commit the output in `release/`. It's git-ignored.
