# Leaderboard — page overrides

Extends `MASTER.md`.

## Structure
1. Hero: eyebrow + category-aware title (`Overall Leaderboard` or `{Category} Leaderboard`) + 2026 side stamp
2. Dashed accent rule
3. Category tabs (Overall + 6 categories); active = solid `#FF6B21`
4. Top-3 podium cards with affiliation, tagline, team-color borders; #01 slightly emphasized
5. Two-column: standings table with leader-proportional progress bars (left) + Match Spotlight / Title Race (right)

## Widgets
- **Match Spotlight:** prefer `in_progress`, else soonest `upcoming`; category-scoped when filtered
- **Title Race:** `{lead} POINT LEAD` + `{1st} over {2nd}` for the active standings set

## Notes
- Table rows link to team detail
- Empty state until DB seeded
