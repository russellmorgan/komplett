---
name: whats-new
description: Update the in-app "What's new?" changelog (src/changelog.json) from commits made since it was last updated. Use when the user says "update what's new", "update the changelog", or "/whats-new".
---

# Update What's new

The footer's "what's new?" link renders `src/changelog.json`, newest release first. The footer
version is `changelog[0].version`. Shape:

```json
[{ "version": "0.1.1", "date": "YYYY-MM-DD", "changes": ["One plain-English sentence."] }]
```

## Steps

1. Find the commits not yet covered: everything after the last commit that touched the changelog.
   ```bash
   git log --no-merges --format='%h %ad %s%n%b' --date=short "$(git log -1 --format=%H -- src/changelog.json)"..HEAD
   ```
   If the changelog has never been committed, ask the user which commit to start from.
   Use `git show --stat <hash>` when a subject alone doesn't say what changed.
2. Drop changes users would never notice: refactors, formatting, lint, tests, build tooling, docs,
   CI, review fixups. Fold commits that are about the same feature into one line.
3. Write each remaining change as one short sentence a non-technical user understands: what they
   can now do, or what got better. No file names, code terms, pixel values or jargon. Match the
   tone of the existing entries.
4. If nothing is user-facing, say so and stop without editing.
5. Otherwise prepend ONE new release containing all the lines, with today's date and the version
   bumped from `changelog[0].version`: patch by default (`0.1` → `0.1.1`, `0.1.1` → `0.1.2`).
   Bump minor (`0.2`) only if the user asks, or ask them if the batch has a big new feature.
6. Run `pnpm exec biome check src/changelog.json`, then show the user the new entry. Don't commit
   unless asked.
