"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/events", label: "Events" },
  { href: "/teams", label: "Teams" },
];

function useClientPathname() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready ? pathname : "";
}

export function PublicHeaderClient() {
  const pathname = useClientPathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        <Link
          href="/leaderboard"
          className="flex min-w-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-90 sm:gap-3"
        >
          <Image
            src="/logo.png"
            alt="ACCESS CPE Fair 2026"
            width={40}
            height={40}
            className="size-9 object-contain drop-shadow-[0_0_12px_rgba(255,107,33,0.35)] sm:size-10"
            priority
          />
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-lg tracking-[0.08em] uppercase sm:text-xl">
              ACCESS
            </span>
            <span className="block truncate text-[9px] tracking-[0.18em] text-muted uppercase sm:text-[10px] sm:tracking-[0.2em]">
              CPE Fair 2026
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative pb-1 text-sm tracking-[0.14em] uppercase transition-colors duration-200 ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-accent" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-md border border-border px-3 py-1.5 text-[10px] tracking-[0.18em] text-muted uppercase sm:inline-flex">
            2026 Season
          </span>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted transition-colors duration-200 hover:text-foreground md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-border px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm tracking-[0.12em] uppercase transition-colors duration-200 ${
                    active
                      ? "border-l-2 border-accent bg-accent-soft text-accent"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
