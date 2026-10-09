# komplett

## Styling

Don't hard-code `px` values in CSS. The app has to work across a wide range of screen sizes, so use the design tokens in `tokens.css` (`--space-*`, `--text-*`, `--tap`, `--radius-*`), relative units (`rem`, `em`, `%`), `clamp()`, and layout (flex/grid `stretch`, `gap`, `min-*`) instead of fixed sizes. If no token fits, add one rather than inlining a number. Any value under 3px (hairline borders, outlines, strokes such as `1px`, `1.5px`, `2px`, `2.5px`) may stay in `px`. Two other exceptions: `box-shadow` offsets and blurs (`--shadow-pop`), and the `999px` "fully round" radius (`--radius-full`, `--radius-dot`). Everything else 3px and up must be tokens, relative units or `clamp()`. Never use `!important` in your CSS, if you try and not use but feel stuck after 2-3 tries continue with the task and explain the issue. Use flexbox for layouts that are one dimensional and grids for any layouts on 2 axis. Use subgrids when aligning content inside grids.

## External Resources
When you need a new icon use this resource: https://fonts.google.com/icons

## Agent skills

### Issue tracker

GitHub Issues on `russellmorgan/komplett` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
