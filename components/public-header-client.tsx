"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/events", label: "Events" },
  { href: "/teams", label: "Teams" },
];

export function PublicHeaderClient() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/leaderboard" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-accent font-display text-lg text-black">
            A
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl tracking-wide">ACCESS</span>
            <span className="block text-[10px] tracking-[0.18em] text-muted uppercase">
              CPE Fair 2026
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm tracking-wide uppercase ${
                  active
                    ? "border-b-2 border-accent pb-1 text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="rounded-full border border-border px-3 py-1 text-[10px] tracking-[0.16em] text-muted uppercase">
          2026 Season
        </span>
      </div>
    </header>
  );
}
