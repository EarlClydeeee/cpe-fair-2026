import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contributors" };

const CONTRIBUTORS = [
  "Charles Zachary DG Nudalo",
  "Earl Clyde M. Bañez",
] as const;

export default function ContributorsPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,33,0.14),transparent_55%),linear-gradient(180deg,var(--surface)_0%,var(--background)_45%)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[10px] tracking-[0.22em] text-accent uppercase">
          Built for ACCESS CPE Fair 2026
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none tracking-wide sm:text-6xl">
          Contributors
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
          The people behind this site’s design, build, and day-to-day polish.
        </p>

        <ul className="mt-10 space-y-4 border-t border-border pt-8">
          {CONTRIBUTORS.map((name, index) => (
            <li
              key={name}
              className="flex items-baseline gap-4 border-b border-border/70 pb-4"
            >
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-2xl leading-none tracking-wide sm:text-3xl">
                {name}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/leaderboard"
          className="mt-10 inline-flex text-sm text-accent transition-colors hover:brightness-110"
        >
          ← Back to leaderboard
        </Link>
      </div>
    </div>
  );
}
