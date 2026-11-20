"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { roleLabel, type AdminRole } from "@/lib/roles";
import { Button } from "./ui/button";

const links = [
  {
    href: "/admin",
    label: "Overview",
    n: "01",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/leaderboards",
    label: "Leaderboards",
    n: "02",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    subLinks: [
      { href: "/admin/leaderboards", label: "1 · Scores", exact: true },
      { href: "/admin/leaderboards/review", label: "2 · Review & publish" },
      { href: "/admin/leaderboards/history", label: "3 · History" },
    ],
  },
  {
    href: "/admin/events",
    label: "Events",
    n: "03",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/admin/categories",
    label: "Categories",
    n: "04",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <path d="M7 7h.01" />
      </svg>
    ),
  },
  {
    href: "/admin/teams",
    label: "Teams",
    n: "05",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/access",
    label: "Admin access",
    n: "06",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      </svg>
    ),
  },
];

function useClientPathname() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready ? pathname : "";
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }];

  if (pathname === "/admin") {
    crumbs.push({ label: "Overview" });
  } else if (pathname.startsWith("/admin/leaderboards")) {
    crumbs.push({ label: "Leaderboards", href: "/admin/leaderboards" });
    if (pathname === "/admin/leaderboards/review") {
      crumbs.push({ label: "Review & publish" });
    } else if (pathname === "/admin/leaderboards/history") {
      crumbs.push({ label: "History" });
    } else if (pathname === "/admin/leaderboards") {
      crumbs.push({ label: "Scores" });
    }
  } else if (pathname === "/admin/events") {
    crumbs.push({ label: "Events" });
  } else if (pathname.startsWith("/admin/categories")) {
    crumbs.push({ label: "Categories" });
  } else if (pathname === "/admin/teams") {
    crumbs.push({ label: "Teams" });
  } else if (pathname === "/admin/access") {
    crumbs.push({ label: "Admin Access" });
  } else {
    const segment = pathname.split("/").pop();
    if (segment) crumbs.push({ label: segment });
  }

  return crumbs;
}

function BreadcrumbBar({ pathname }: { pathname: string }) {
  const crumbs = getBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.label} className="inline-flex items-center gap-1.5">
            {idx > 0 && <span className="opacity-40">/</span>}
            {isLast || !crumb.href ? (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function ReviewBadge({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-black ${className}`}
      aria-label={`${count} draft${count === 1 ? "" : "s"} waiting for review`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLinks({
  pathname,
  onNavigate,
  reviewDraftCount = 0,
}: {
  pathname: string;
  onNavigate?: () => void;
  reviewDraftCount?: number;
}) {
  return (
    <nav className="space-y-1.5" aria-label="Admin workspace">
      {links.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        const showSubLinks =
          Boolean(link.subLinks) && pathname.startsWith(link.href);
        const isLeaderboards = link.href === "/admin/leaderboards";

        return (
          <div key={link.href} className="space-y-1">
            <Link
              href={
                isLeaderboards && reviewDraftCount > 0
                  ? "/admin/leaderboards/review"
                  : link.href
              }
              onClick={onNavigate}
              className={`flex min-h-10 items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "border border-accent/40 bg-accent-soft text-accent shadow-sm"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? "text-accent" : "text-muted"}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
                {isLeaderboards ? (
                  <ReviewBadge count={reviewDraftCount} />
                ) : null}
              </div>
              <span className="font-mono text-[10px] opacity-60">{link.n}</span>
            </Link>

            {showSubLinks && link.subLinks ? (
              <div className="ml-5 space-y-1 border-l border-border/80 pl-3 pt-0.5">
                {link.subLinks.map((sub) => {
                  const isSubActive = sub.exact
                    ? pathname === sub.href
                    : pathname.startsWith(sub.href);
                  const isReview = sub.href.endsWith("/review");
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={onNavigate}
                      className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                        isSubActive
                          ? "bg-surface-2 font-semibold text-accent"
                          : "text-muted hover:bg-surface-2 hover:text-foreground"
                      }`}
                    >
                      <span>{sub.label}</span>
                      {isReview ? <ReviewBadge count={reviewDraftCount} /> : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarChrome({
  role,
  seasonName,
  pathname,
  onNavigate,
  reviewDraftCount = 0,
}: {
  role: AdminRole;
  seasonName: string;
  pathname: string;
  onNavigate?: () => void;
  reviewDraftCount?: number;
}) {
  return (
    <>
      <Link
        href="/admin"
        onClick={onNavigate}
        className="mb-6 flex items-center gap-3 px-2 transition-opacity duration-200 hover:opacity-90 md:mb-8"
      >
        <Image
          src="/logo.png"
          alt="ACCESS Control Room"
          width={40}
          height={40}
          className="size-9 object-contain drop-shadow-[0_0_12px_rgba(255,107,33,0.35)] md:size-10"
          priority
        />
        <span>
          <span className="block font-display text-lg leading-none">ACCESS</span>
          <span className="mt-0.5 block text-[10px] tracking-[0.16em] text-muted uppercase">
            Control Room
          </span>
        </span>
      </Link>

      <p className="px-2 text-[10px] tracking-[0.18em] text-muted uppercase font-semibold">
        Workspace Navigation
      </p>
      <div className="mt-2.5">
        <NavLinks
          pathname={pathname}
          onNavigate={onNavigate}
          reviewDraftCount={reviewDraftCount}
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface-2 p-3 md:mt-8">
        <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Season</p>
        <p className="mt-1 text-sm font-medium">{seasonName}</p>
      </div>

      <div className="mt-auto space-y-3 pt-6 md:pt-8">
        <div className="rounded-xl border border-accent/20 bg-[#2a1a12] p-3">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Active session
          </p>
          <p className="mt-1 text-xs font-semibold tracking-wide text-accent uppercase">
            {roleLabel(role)}
          </p>
          <Link
            href="/leaderboard"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition"
          >
            <span>Preview Public Site</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full min-h-10 text-xs">
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}

export function AdminShell({
  role,
  seasonName,
  reviewDraftCount = 0,
  children,
}: {
  role: AdminRole;
  seasonName: string;
  reviewDraftCount?: number;
  children: React.ReactNode;
}) {
  const pathname = useClientPathname();
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <SidebarChrome
          role={role}
          seasonName={seasonName}
          pathname={pathname}
          reviewDraftCount={reviewDraftCount}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)] md:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
                priority
              />
              <span className="min-w-0 leading-tight">
                <span className="block font-display text-base leading-none">ACCESS</span>
                <span className="block truncate text-[9px] tracking-[0.16em] text-muted uppercase">
                  Control room
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-surface-2 px-2 py-1 text-[9px] tracking-[0.12em] text-accent uppercase font-semibold">
                {roleLabel(role)}
              </span>
              <button
                type="button"
                className="relative inline-flex size-10 items-center justify-center rounded-md border border-border text-muted transition-colors duration-200 hover:text-foreground"
                aria-expanded={open}
                aria-controls={drawerId}
                onClick={() => setOpen((v) => !v)}
              >
                <span className="sr-only">Workspace menu</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  {open ? (
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  ) : (
                    <path
                      d="M4 7h16M4 12h16M4 17h16"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  )}
                </svg>
                {!open ? (
                  <ReviewBadge
                    count={reviewDraftCount}
                    className="absolute -top-1 -right-1"
                  />
                ) : null}
              </button>
            </div>
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 md:hidden" role="presentation">
            <button
              type="button"
              aria-label="Close workspace menu"
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <aside
              id={drawerId}
              className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-r border-border bg-surface px-4 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-2xl"
            >
              <SidebarChrome
                role={role}
                seasonName={seasonName}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
                reviewDraftCount={reviewDraftCount}
              />
            </aside>
          </div>
        ) : null}

        <div className="hidden items-center justify-between gap-3 border-b border-border px-6 py-3.5 md:flex">
          <BreadcrumbBar pathname={pathname} />
          <div className="flex items-center gap-2.5">
            <Link
              href="/leaderboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-accent hover:text-foreground"
            >
              <span>View public site</span>
              <span className="text-[10px]">↗</span>
            </Link>
            <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
              {roleLabel(role)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 md:hidden">
          <BreadcrumbBar pathname={pathname} />
          <Link
            href="/leaderboard"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md border border-border px-2 py-1 text-[10px] tracking-[0.08em] text-muted uppercase transition-colors duration-200 hover:text-foreground"
          >
            Public site ↗
          </Link>
        </div>

        <div className="flex-1 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}