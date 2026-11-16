import Link from "next/link";
import { PublicHeaderClient } from "./public-header-client";

export function PublicHeader() {
  return <PublicHeaderClient />;
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.3fr_1fr_1fr] sm:px-6">
        <div>
          <p className="font-display text-2xl">ACCESS CPE Fair 2026</p>
          <p className="mt-2 text-sm tracking-wide text-accent uppercase">Fly high. Play as one.</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            Eight teams. Six categories. One champion.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Explore</p>
          <Link href="/leaderboard" className="block text-muted hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/events" className="block text-muted hover:text-foreground">
            Events
          </Link>
          <Link href="/teams" className="block text-muted hover:text-foreground">
            Teams
          </Link>
          <Link href="/login" className="block text-accent hover:underline">
            Admin sign in →
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">The competition</p>
          {["Sports", "Logic & Board", "Esports", "Academics", "Talents", "Mini Games"].map((c) => (
            <p key={c} className="text-muted">
              {c}
            </p>
          ))}
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-xs text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2">
          <span>© 2026 ACCESS — CPE Fair</span>
          <span>8 teams / 6 categories / one champion</span>
        </div>
      </div>
    </footer>
  );
}
