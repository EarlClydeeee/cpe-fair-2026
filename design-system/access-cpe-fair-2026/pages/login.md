# Login — page overrides

Extends `MASTER.md`.

## Structure
- Centered dark card on atmospheric background (radial accent wash)
- Orange top accent rule on the card
- ACCESS mark, “Umpires Gate” title, restricted-access subtitle
- Single **Access code** field (password) with lock icon + Show toggle
- CTA: Enter terminal
- Footer: Back to leaderboard

## Auth behavior
- UI collects access code only
- Server signs in with fixed `ADMIN_LOGIN_EMAIL` (default `admin@gmail.com`) + submitted code via Supabase `signInWithPassword`
- No email field; Supabase Auth user is unchanged

## Notes
- No public header/footer on this route
- Accent CTA remains `#FF6B21` on black
