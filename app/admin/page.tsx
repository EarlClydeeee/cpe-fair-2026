import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOverview } from "@/lib/data/admin";
import { eventStatusLabel, formatPoints, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const { stats, diffs, activity } = await getOverview();
  const firstDiff = diffs[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Workspace Overview</h1>
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
            `${stats.upcoming} upcoming, ${stats.inProgress} in progress, ${stats.finals} final`,
          ],
          ["Published points", formatPoints(stats.publishedPoints), "Current overall standings"],
          ["Saved draft", String(stats.drafts).padStart(2, "0"), "Score updates ready for review"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">{label}</p>
            <p className="mt-2 font-display text-4xl">{value}</p>
            <p className="mt-2 text-xs text-muted">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          {firstDiff ? (
            <div className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
              <p className="text-[10px] tracking-[0.16em] text-accent uppercase">Ready for review</p>
              <h2 className="mt-2 font-display text-3xl">
                {firstDiff.team.name} / {firstDiff.category.name}
              </h2>
              <p className="mt-2 text-sm">
                {firstDiff.publishedPoints} → {firstDiff.draft.draft_points}{" "}
                <span className="text-accent">
                  ({firstDiff.delta >= 0 ? "+" : ""}
                  {firstDiff.delta} pts)
                </span>
              </p>
              <LinkButton href="/admin/leaderboards/review" className="mt-4">
                Review & publish ({diffs.length})
              </LinkButton>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
              No score drafts waiting for review.
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Event activity</p>
            <ul className="mt-4 space-y-3">
              {activity.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="text-muted">{formatTime(event.starts_at)}</span>{" "}
                    {event.title}
                  </span>
                  <Badge
                    tone={
                      event.status === "in_progress"
                        ? "accent"
                        : event.status === "final"
                          ? "info"
                          : "muted"
                    }
                  >
                    {eventStatusLabel(event.status)}
                  </Badge>
                </li>
              ))}
            </ul>
            <Link href="/admin/events" className="mt-4 inline-block text-sm text-accent">
              Manage events →
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
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
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Quick actions</p>
            <Link href="/admin/teams" className="block">
              <p className="font-display text-2xl">Manage teams →</p>
              <p className="text-xs text-muted">Names, affiliations, visibility</p>
            </Link>
            <Link href="/admin/access" className="block">
              <p className="font-display text-2xl">Admin access →</p>
              <p className="text-xs text-muted">Invite editors and roles</p>
            </Link>
            <Link href="/admin/leaderboards/history" className="block">
              <p className="font-display text-2xl">View change history →</p>
              <p className="text-xs text-muted">Track score edits</p>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
