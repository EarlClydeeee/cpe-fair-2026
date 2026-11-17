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
    <footer className="mt-auto border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-10 sm:px-6 sm:py-14">
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
          <p className="font-display text-2xl leading-none tracking-wide sm:text-3xl">
            Fly high. Play as one.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted sm:mt-4">
            ACCESS CPE Fair 2026 — eight teams, seven categories, one champion.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:contents">
          <div className="space-y-2 text-sm">
            <p className="text-[10px] tracking-[0.18em] text-muted uppercase">Explore</p>
            <Link href="/leaderboard" className="block py-0.5 text-foreground/90 transition-colors hover:text-accent">
              Leaderboard
            </Link>
            <Link href="/events" className="block py-0.5 text-foreground/90 transition-colors hover:text-accent">
              Events
            </Link>
            <Link href="/teams" className="block py-0.5 text-foreground/90 transition-colors hover:text-accent">
              Teams
            </Link>
            <Link href="/login" className="block py-0.5 text-accent transition-colors hover:brightness-110">
              Admin sign in →
            </Link>
          </div>
          <div className="hidden space-y-2 text-sm sm:block">
            <p className="text-[10px] tracking-[0.18em] text-muted uppercase">The competition</p>
            {["Sports", "Logic & Board", "Esports", "Academics", "Talents", "Mini Games", "Literacy"].map((c) => (
              <p key={c} className="text-muted">
                {c}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-xs text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <span>© 2026 ACCESS · CPE Fair</span>
          <span className="tracking-[0.12em] uppercase">8 teams / 7 categories / one champion</span>
          {isSample ? <span>Sample content · For UI preview only</span> : null}
        </div>
      </div>
    </footer>
  );
}
