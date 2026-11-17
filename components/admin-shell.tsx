"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { roleLabel, type AdminRole } from "@/lib/roles";
import { Button } from "./ui/button";

const links = [
  { href: "/admin", label: "Overview", n: "01" },
  { href: "/admin/leaderboards", label: "Leaderboards", n: "02" },
  { href: "/admin/events", label: "Events", n: "03" },
  { href: "/admin/teams", label: "Teams", n: "04" },
  { href: "/admin/access", label: "Admin access", n: "05" },
];

function useClientPathname() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready ? pathname : "";
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1" aria-label="Admin workspace">
      {links.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
              isActive
                ? "border border-accent/40 bg-accent-soft text-accent"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            <span className="font-mono text-[10px] opacity-70">{link.n}</span>
            {link.label}
          </Link>
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
}: {
  role: AdminRole;
  seasonName: string;
  pathname: string;
  onNavigate?: () => void;
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

      <p className="px-2 text-[10px] tracking-[0.18em] text-muted uppercase">
        Workspace
      </p>
      <div className="mt-3">
        <NavLinks pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface-2 p-3 md:mt-8">
        <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Season</p>
        <p className="mt-1 text-sm font-medium">{seasonName}</p>
      </div>

      <div className="mt-auto space-y-3 pt-6 md:pt-8">
        <div className="rounded-xl border border-accent/20 bg-[#2a1a12] p-3">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Preview workspace
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Sample scores and fixtures for UI preview.
          </p>
          <p className="mt-2 text-xs font-semibold tracking-wide text-accent uppercase">
            {roleLabel(role)}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full min-h-11">
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
  children,
}: {
  role: AdminRole;
  seasonName: string;
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
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <SidebarChrome role={role} seasonName={seasonName} pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone top bar */}
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
              <span className="rounded-md bg-surface-2 px-2 py-1 text-[9px] tracking-[0.12em] text-accent uppercase">
                {roleLabel(role)}
              </span>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted transition-colors duration-200 hover:text-foreground"
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
              </button>
            </div>
          </div>
        </header>

        {/* Phone drawer */}
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
              />
            </aside>
          </div>
        ) : null}

        {/* Desktop top bar */}
        <div className="hidden items-center justify-between gap-3 border-b border-border px-6 py-4 md:flex">
          <p className="text-xs tracking-wide text-muted">Admin / Control room</p>
          <div className="flex items-center gap-2">
            <Link
              href="/leaderboard"
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:text-foreground"
            >
              View public site
            </Link>
            <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs tracking-wide text-accent uppercase">
              {roleLabel(role)}
            </span>
          </div>
        </div>

        {/* Phone utility strip */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 md:hidden">
          <p className="truncate text-[11px] tracking-wide text-muted">
            Admin / Control room
          </p>
          <Link
            href="/leaderboard"
            className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[10px] tracking-[0.08em] text-muted uppercase transition-colors duration-200 hover:text-foreground"
          >
            Public site
          </Link>
        </div>

        <div className="flex-1 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Prefer AdminShell — kept for any direct imports during transition */
export function AdminSidebar({
  role,
  seasonName,
}: {
  role: AdminRole;
  seasonName: string;
}) {
  const pathname = useClientPathname();
  return (
    <aside className="flex h-full min-h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
      <SidebarChrome role={role} seasonName={seasonName} pathname={pathname} />
    </aside>
  );
}

export function AdminTopBar({
  crumbs,
  role,
}: {
  crumbs: string;
  role: AdminRole;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
      <p className="text-xs tracking-wide text-muted">{crumbs}</p>
      <div className="flex items-center gap-2">
        <Link
          href="/leaderboard"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:text-foreground"
        >
          View public site
        </Link>
        <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs tracking-wide text-accent uppercase">
          {roleLabel(role)}
        </span>
      </div>
    </div>
  );
}
