"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/admin/leaderboards",
    label: "Scores",
    exact: true,
    description: "Edit one team and category at a time. Nothing here is public until you publish.",
  },
  {
    href: "/admin/leaderboards/review",
    label: "Review & publish",
    description: "Check who moves and by how many points, then publish the public board.",
  },
  {
    href: "/admin/leaderboards/history",
    label: "History",
    description: "Search the record of drafts, publishes, and content updates.",
  },
];

export function LeaderboardNav({ draftCount = 0 }: { draftCount?: number }) {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => (tab.exact ? pathname === tab.href : pathname.startsWith(tab.href))),
  );
  const active = tabs[activeIndex];
  const next = tabs[activeIndex + 1];

  return (
    <div className="space-y-3 border-b border-border pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Leaderboard steps">
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex;
            return (
              <span key={tab.href} className="inline-flex items-center gap-2">
                {index > 0 ? <span className="text-xs text-muted/50" aria-hidden>→</span> : null}
                <Link
                  href={tab.href}
                  aria-current={isActive ? "step" : undefined}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "border border-accent/40 bg-accent-soft text-accent shadow-sm"
                      : "border border-border/60 bg-surface text-muted hover:border-border hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70">{index + 1}</span>
                  <span>{tab.label}</span>
                  {tab.href.endsWith("/review") && draftCount > 0 ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-black">
                      {draftCount}
                    </span>
                  ) : null}
                </Link>
              </span>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-xs">
          {next ? (
            <Link href={next.href} className="font-medium text-accent hover:opacity-80">
              Next: {next.label} →
            </Link>
          ) : (
            <Link href="/admin/leaderboards" className="font-medium text-accent hover:opacity-80">
              Back to scores
            </Link>
          )}
          <Link
            href="/leaderboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted transition hover:text-foreground"
          >
            <span>Public board</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
      </div>
      <p className="text-xs text-muted">
        Step {activeIndex + 1} of {tabs.length}. {active?.description}
      </p>
    </div>
  );
}
