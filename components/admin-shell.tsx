"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
      <Link href="/admin" className="mb-8 flex items-center gap-3 px-2 transition-opacity duration-200 hover:opacity-90">
        <span className="grid size-9 place-items-center rounded-md bg-accent font-display text-lg text-black">
          A
        </span>
        <span>
          <span className="block font-display text-lg">ACCESS</span>
          <span className="block text-[10px] tracking-[0.16em] text-muted uppercase">
            Control Room
          </span>
        </span>
      </Link>

      <p className="px-2 text-[10px] tracking-[0.18em] text-muted uppercase">Workspace</p>
      <nav className="mt-3 space-y-1">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
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

      <div className="mt-8 rounded-xl border border-border bg-surface-2 p-3">
        <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Season</p>
        <p className="mt-1 text-sm font-medium">{seasonName}</p>
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <div className="rounded-xl border border-accent/20 bg-[#2a1a12] p-3">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Preview workspace</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Sample scores and fixtures for UI preview.
          </p>
          <p className="mt-2 text-xs font-semibold tracking-wide text-accent uppercase">
            {roleLabel(role)}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
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
