---
name: build-desktop
description: Build the Komplett desktop installers for both Mac (DMG) and Windows (.exe) using the GitHub Actions workflow, then download them locally. Use when the user says "build windows", "build the windows version", "build desktop", "build mac and windows", "build both", or "/build-desktop".
---

# Build Mac + Windows desktop installers

Runs `.github/workflows/desktop.yml` on GitHub. Its two jobs build the macOS DMGs on a `macos-latest`
runner and the Windows `.exe` on a `windows-latest` runner. Windows can't be built reliably from a Mac,
so this skill always goes through CI. For Mac only, use `/build-mac`, which is faster.

## Steps

1. **Check the code is pushed.** CI builds the commit on the remote branch, not the local working tree.
   ```bash
   git status --short
   git fetch origin && git rev-list --left-right --count origin/<branch>...<branch>
   ```
   If there are uncommitted changes or unpushed commits, tell the user and ask before pushing or
   committing. Don't push on your own.
2. **Check the Firebase secrets exist.** The build fails without them.
   ```bash
   gh secret list -R russellmorgan/komplett
   ```
   Expect `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_APP_ID`. If any are missing, set them from `.env` with
   `printf "%s" "$VALUE" | gh secret set NAME -R russellmorgan/komplett` (read the value from `.env`
   under bash, don't print it), or ask the user to add them in the GitHub settings.
3. **Start the run** on the branch to build (usually the current one):
   ```bash
   gh workflow run desktop.yml -R russellmorgan/komplett --ref <branch>
   sleep 8 && gh run list -R russellmorgan/komplett --workflow desktop.yml --limit 1
   ```
   Note the run ID from the output.
4. **Wait for it to finish** (takes roughly 5–10 minutes). Use a single long wait, not polling:
   ```bash
   gh run watch <run-id> -R russellmorgan/komplett --exit-status
   ```
   If the watch command times out, run it again. If it exits non-zero, check the failing job:
   ```bash
   gh run view <run-id> -R russellmorgan/komplett --log-failed
   ```
5. **Download the installers** into `release/ci/`:
   ```bash
   gh run download <run-id> -R russellmorgan/komplett -D release/ci
   ls -lh release/ci/*
   ```
   This gives `release/ci/komplett-macos-latest/*.dmg` and `release/ci/komplett-windows-latest/*.exe`.
6. Report the run URL, whether each job passed, and the local paths of both installers.

## Notes

- The `release` job in the workflow only runs for version tags (`v*`). Manual runs skip it. To publish
  a GitHub release, push a tag like `v0.13.1` instead of using this skill.
- The Windows installer is not code-signed, so SmartScreen warns on first run.
- Don't commit `release/` output; it's git-ignored.
