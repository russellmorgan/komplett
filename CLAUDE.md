# komplett

## Styling

Don't hard-code `px` values in CSS. The app has to work across a wide range of screen sizes, so use the design tokens in `tokens.css` (`--space-*`, `--text-*`, `--tap`, `--radius-*`), relative units (`rem`, `em`, `%`), `clamp()`, and layout (flex/grid `stretch`, `gap`, `min-*`) instead of fixed sizes. If no token fits, add one rather than inlining a number. Hairline borders (`1px`) are the only exception.

## Agent skills

### Issue tracker

GitHub Issues on `russellmorgan/komplett` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
