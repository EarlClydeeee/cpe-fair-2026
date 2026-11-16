import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getAuditLog } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Change history" };

type Props = { searchParams: Promise<{ q?: string; action?: string; id?: string }> };

export default async function ChangeHistoryPage({ searchParams }: Props) {
  const { q, action = "all", id } = await searchParams;
  const rows = await getAuditLog({ q, action });
  const selected = rows.find((r) => r.id === id) ?? rows[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            A clear record of every update
          </p>
          <h1 className="mt-2 font-display text-5xl">Change History</h1>
          <p className="mt-2 text-sm text-muted">
            Trace score drafts, published results, and fair-content updates.
          </p>
        </div>
        <LinkButton href="/api/admin/history/export" variant="secondary">
          Export history
        </LinkButton>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search history..."
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
        />
        <select
          name="action"
          defaultValue={action}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
        >
          <option value="all">Action: All</option>
          <option value="draft_saved">Draft saved</option>
          <option value="published">Published</option>
          <option value="event_updated">Event updated</option>
          <option value="team_updated">Team updated</option>
        </select>
        <button type="submit" className="rounded-lg bg-surface-2 px-3 text-sm text-muted">
          Filter
        </button>
        <span className="self-center text-xs text-muted">{rows.length} records</span>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/leaderboards/history?id=${row.id}${q ? `&q=${q}` : ""}${
                  action !== "all" ? `&action=${action}` : ""
                }`}
                className={`block rounded-xl border px-4 py-3 ${
                  selected?.id === row.id
                    ? "border-accent/50 bg-accent-soft"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={row.action === "published" ? "success" : "accent"}>
                    {row.action.replaceAll("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted">{formatDateTime(row.created_at)}</span>
                </div>
                <p className="mt-2 text-sm">{row.summary}</p>
              </Link>
            </li>
          ))}
        </ul>

        {selected ? (
          <aside className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-wide text-muted uppercase">
              {selected.entity_type} / {selected.action}
            </p>
            <h2 className="mt-2 font-display text-3xl">Change details</h2>
            <p className="mt-3 text-sm leading-6">{selected.summary}</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Actor</dt>
                <dd>{selected.actor_id ?? "System"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Saved time</dt>
                <dd>{formatDateTime(selected.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Entity</dt>
                <dd className="font-mono text-xs">{selected.entity_id ?? "—"}</dd>
              </div>
            </dl>
            {selected.action === "draft_saved" ? (
              <LinkButton href="/admin/leaderboards" className="mt-6 w-full">
                Open scores
              </LinkButton>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
