# Design System Master File — ACCESS CPE Fair 2026

> Figma source of truth (screenshots). ui-ux-pro-max style = Dark OLED + competitive esports.
> CTA is **orange `#FF6B21`**, not the skill default green.

**Project:** ACCESS CPE Fair 2026  
**Slogan:** Fly high. Play as one.

## Color Palette

| Role | Hex | CSS |
|------|-----|-----|
| Background | `#0A0A0A` | `--background` |
| Surface | `#141414` | `--surface` |
| Surface 2 | `#1C1C1C` | `--surface-2` |
| Border | `#2A2A2A` | `--border` |
| Accent / CTA | `#FF6B21` | `--accent` |
| Text | `#F5F5F5` | `--foreground` |
| Muted | `#9A9A9A` | `--muted` |
| Success | `#34D399` | `--success` |
| Info | `#60A5FA` | `--info` |

## Typography

- **Display:** Russo One (condensed impact headlines, all-caps sections)
- **Body:** Chakra Petch (tech / competitive UI)

## Layout

- Public max width: `max-w-6xl`
- Admin: fixed left sidebar ~256px + main
- Cards: 12px radius, 1px border `#2A2A2A`
- Dashed accent rules under heroes

## Motion

- Transitions 150–300ms, ease-out
- Respect `prefers-reduced-motion`
- No layout-shifting hover scales; use color/opacity/border

## Interaction

- `cursor-pointer` on all clickable controls
- Visible focus rings using accent
- No emoji icons — placeholders or SVG only

## Anti-patterns

- Light mode default
- Purple/indigo AI gradients
- Green CTA (override skill default)
- Hover scale that shifts layout
