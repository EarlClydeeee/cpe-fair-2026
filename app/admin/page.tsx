import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOverview } from "@/lib/data/admin";
import {
  eventAdminStatusDisplay,
  eventStatusTone,
  getComputedEventStatus,
} from "@/lib/events";
import { formatPoints, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin overview" };

async function AdminOverviewContent() {
  const { stats, diffs, activity } = await getOverview();
  const now = new Date();
  const firstDiff = diffs[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-accent uppercase">
            Your court. Your control.
          </p>
          <h1 className="mt-2 font-display text-5xl">Workspace Overview</h1>
          <p className="mt-2 text-sm text-muted">
            A clear view of the fair, the teams, and what needs your attention.
          </p>
        </div>
        <LinkButton href="/admin/leaderboards">Manage scores</LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active teams", String(stats.teams).padStart(2, "0"), "Seven sections + Fukurodani"],
          [
            "Events",
            String(stats.events).padStart(2, "0"),
            `${stats.upcoming} upcoming · ${stats.inProgress} ongoing · ${stats.finals} ended`,
          ],
          ["Published points", formatPoints(stats.publishedPoints), "Current overall standings"],
          [
            "Saved draft",
            String(stats.drafts).padStart(2, "0"),
            stats.drafts
              ? "Score updates ready for review"
              : "No drafts waiting",
          ],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">{label}</p>
            <p
              className={`mt-2 font-display text-4xl ${
                label === "Saved draft" && stats.drafts > 0 ? "text-accent" : ""
              }`}
            >
              {value}
            </p>
            <p className="mt-2 text-xs text-muted">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          {firstDiff ? (
            <div className="rounded-xl border border-accent/40 bg-accent-soft p-5">
              <p className="text-[10px] tracking-[0.16em] text-accent uppercase">
                Ready for review
              </p>
              <p className="mt-1 text-sm text-muted">
                {diffs.length} saved draft{diffs.length === 1 ? "" : "s"} waiting to go public.
              </p>
              <div className="mt-4 rounded-lg border border-accent/30 bg-background/40 p-4">
                <p className="text-xs tracking-wide text-accent uppercase">
                  {firstDiff.team.name} / {firstDiff.category.name}
                </p>
                <p className="mt-2 font-display text-3xl">
                  {firstDiff.publishedPoints} → {firstDiff.draft.draft_points}
                </p>
                <p className="mt-1 text-sm text-accent">
                  {firstDiff.delta >= 0 ? "+" : ""}
                  {firstDiff.delta} pts
                </p>
              </div>
              <LinkButton href="/admin/leaderboards/review" className="mt-4">
                Review & publish ({diffs.length})
              </LinkButton>
              <p className="mt-3 text-xs text-muted">Public standings are unchanged.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
              No score drafts waiting for review.
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Event activity</p>
            <p className="mt-1 text-sm text-muted">Current schedule snapshot.</p>
            <ul className="mt-4 space-y-3">
              {activity.map((event) => {
                const status = getComputedEventStatus(event, now);
                return (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      <span className="text-muted">{formatTime(event.start_at)}</span>{" "}
                      {event.name}
                      {event.team_a && event.team_b
                        ? ` (${event.team_a.name} vs ${event.team_b.name})`
                        : ""}
                    </span>
                    <Badge tone={eventStatusTone(status)}>
                      {eventAdminStatusDisplay(status)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/admin/events"
              className="mt-4 inline-block text-sm text-accent transition-opacity duration-200 hover:opacity-80"
            >
              Manage events →
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Workspace health</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted">Team entries</span>
                <span>
                  {stats.teams} / {stats.teams} active
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted">Competition categories</span>
                <span>{stats.categories} configured</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted">Season</span>
                <span>2026</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-accent">Preview data · Replace before launch</p>
          </div>
          <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Quick actions</p>
            <Link href="/admin/teams" className="block transition-opacity duration-200 hover:opacity-80">
              <p className="font-display text-2xl">Manage teams →</p>
              <p className="text-xs text-muted">Names, affiliations, and team visibility</p>
            </Link>
            <Link href="/admin/access" className="block transition-opacity duration-200 hover:opacity-80">
              <p className="font-display text-2xl">Admin access →</p>
              <p className="text-xs text-muted">Invite editors and review roles</p>
            </Link>
            <Link
              href="/admin/leaderboards/history"
              className="block transition-opacity duration-200 hover:opacity-80"
            >
              <p className="font-display text-2xl">View change history →</p>
              <p className="text-xs text-muted">Track score edits and publications</p>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Loading overview…
        </div>
      }
    >
      <AdminOverviewContent />
    </Suspense>
  );
}
