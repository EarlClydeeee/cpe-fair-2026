import Image from "next/image";
import Link from "next/link";
import { getStandings } from "@/lib/data/public";
import { PublicHeaderClient } from "./public-header-client";

export function PublicHeader() {
  return <PublicHeaderClient />;
}

export async function PublicFooter() {
  const { source } = await getStandings();
  const isSample = source === "sample";

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ACCESS CPE Fair 2026"
              width={36}
              height={36}
              className="size-9 object-contain drop-shadow-[0_0_10px_rgba(255,107,33,0.3)]"
            />
            <span className="font-display text-lg tracking-wide">Access</span>
          </div>
          <p className="font-display text-3xl leading-none tracking-wide">
            Fly high. Play as one.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            ACCESS CPE Fair 2026 — eight teams, seven categories, one champion.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-[10px] tracking-[0.18em] text-muted uppercase">Explore</p>
          <Link href="/leaderboard" className="block text-foreground/90 transition-colors hover:text-accent">
            Leaderboard
          </Link>
          <Link href="/events" className="block text-foreground/90 transition-colors hover:text-accent">
            Events
          </Link>
          <Link href="/teams" className="block text-foreground/90 transition-colors hover:text-accent">
            Teams
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-[10px] tracking-[0.18em] text-muted uppercase">The competition</p>
          {["Sports", "Logic & Board", "Esports", "Academics", "Talents", "Mini Games", "Literacy"].map((c) => (
            <p key={c} className="text-muted">
              {c}
            </p>
          ))}
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-xs text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <span>© 2026 ACCESS · CPE Fair</span>
          <span className="tracking-[0.12em] uppercase">8 teams / 7 categories / one champion</span>
          {isSample ? <span>Sample content · For UI preview only</span> : null}
        </div>
      </div>
    </footer>
  );
}
