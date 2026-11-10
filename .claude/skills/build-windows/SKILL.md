---
name: build-windows
description: Release-build the Komplett Windows desktop app locally on this PC: bump the version by 0.1, add the What's new entry, build the installer, and delete the old executables. Use when the user says "build windows", "build the windows version", "ship a new build", or "/build-windows".
---

# Build the Windows app

Runs on this Windows PC, no GitHub involved. Every build is a new release: the version goes up by
one minor step, the changelog gets a matching entry, and older installers are removed so
`release/` only ever holds the current one. (Mac: `/build-mac`. Both platforms through CI:
`/build-desktop`. Those don't bump the version yet; if you build them for a release, do steps 1–2 here first.)

## Steps

1. **Bump the version by 0.1** (minor, not patch): `0.13.0` → `0.14.0`. Two places must agree:
   - `electron/package.json` `version`, which names the installer (`Komplett-<version>-Windows.exe`).
   - `src/changelog.json`, whose first entry is the version shown in the app footer (`"0.14"`, no patch digit).
   ```bash
   node -p "require('./electron/package.json').version"
   ```
   Edit `electron/package.json` to the new `X.Y.0`.
2. **Add the What's new entry** by running the `whats-new` skill, with one override: use the new
   minor version (`0.14`) instead of its default patch bump. If it finds nothing user-facing, stop
   and ask the user whether to release anyway, so the footer and installer versions never disagree.
3. **Check `.env`** exists at the repo root with the four `VITE_FIREBASE_*` values. The build bakes
   them in. Don't print the values.
4. **Build** (a few minutes; the first run downloads Electron):
   ```powershell
   pnpm electron:dist -- --win
   ```
5. **Verify the new installer exists**, then delete the old executables. Only delete after the build
   succeeded, so a failed build never leaves `release/` empty:
   ```bash
   ls release/Komplett-<new version>-Windows.exe
   find release -maxdepth 1 -name 'Komplett-*' ! -name 'Komplett-<new version>-*' -delete
   ```
   That removes older `.exe` and `.exe.blockmap` files. Leave `release/ci/` and `win-unpacked/` alone.
6. **Report** the installer path and size, plus the version change (`0.13` → `0.14`). Don't commit
   unless asked; earlier releases were committed as `Release vX.Y` containing the
   `electron/package.json` bump and the changelog entry.

## Notes

- The installer is not code-signed, so SmartScreen warns on first run.
- Don't commit `release/`. It's git-ignored.
- To publish to GitHub instead, push a `v*` tag. The workflow's release job builds and publishes it.
