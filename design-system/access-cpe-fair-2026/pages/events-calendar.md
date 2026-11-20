# Events Calendar — Page Overrides

> Overrides `MASTER.md` for the public Events calendar only.

## Layout

- **Mobile / tablet (`< lg`)**: Calendar sits **under category filters**, above the schedule list (original stack).
- **Laptop (`lg+`)**: Two-column layout — schedule left, **calendar sticky on the right** (`lg:sticky lg:top-24`).
- Calendar panel width: `320px` at `lg`, `360px` at `xl`.
- Use brand tokens only (`surface`, `border`, `accent`) — no indigo/purple from skill defaults.

## Calendar UI

- Month label: `font-display` uppercase
- Weekday headers: muted, tracking-wide, 10–11px
- Day cells: square-ish hit targets, `min-h-10`, `rounded-lg`, `transition-colors duration-200`
- Days with events: accent soft fill + accent border tip or dot
- Selected day: solid accent background, black/dark text (matches filter chips)
- Empty / other-month padding: invisible / muted low-contrast
- Month switcher: border buttons, accent on hover — SVG chevrons, no emoji
- Panel chrome: `rounded-xl border border-border bg-surface`

## Interaction

- Every day cell with events is a link (`cursor-pointer`)
- Focus-visible accent ring
- Prefer `color`/`border` hover — no layout-shifting scale
