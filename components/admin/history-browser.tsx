"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export type HistoryRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  actor_id: string | null;
  created_at: string;
};

const ACTIONS = [
  { value: "all", label: "All actions" },
  { value: "draft_saved", label: "Draft saved" },
  { value: "published", label: "Published" },
  { value: "event_updated", label: "Event updated" },
  { value: "team_updated", label: "Team updated" },
];

export function HistoryBrowser({
  rows,
  initialQuery = "",
  initialAction = "all",
  initialId,
}: {
  rows: HistoryRow[];
  initialQuery?: string;
  initialAction?: string;
  initialId?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [action, setAction] = useState(initialAction);
  const [selectedId, setSelectedId] = useState(initialId ?? rows[0]?.id ?? "");
  const [focus, setFocus] = useState<"list" | "detail">(initialId ? "detail" : "list");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (action !== "all" && row.action !== action) return false;
      if (!needle) return true;
      return [row.summary, row.entity_type, row.action, row.actor_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query, action]);

  const selected = rows.find((row) => row.id === selectedId) ?? filtered[0];

  function remember(nextQuery: string, nextAction: string, nextId: string) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextAction !== "all") params.set("action", nextAction);
    if (nextId) params.set("id", nextId);
    const search = params.toString();
    window.history.replaceState(null, "", `/admin/leaderboards/history${search ? `?${search}` : ""}`);
  }

  function choose(id: string) {
    setSelectedId(id);
    setFocus("detail");
    remember(query, action, id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            remember(next, action, selectedId);
          }}
          placeholder="Search summary, actor, or type..."
          className="min-w-[14rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted/60"
        />
        <select
          value={action}
          onChange={(event) => {
            const next = event.target.value;
            setAction(next);
            remember(query, next, selectedId);
          }}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
        >
          {ACTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="text-xs font-medium text-muted">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
        <div className={focus === "detail" ? "hidden lg:block" : ""}>
          <ul className="space-y-2">
            {filtered.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => choose(row.id)}
                  className={`block w-full rounded-xl border px-4 py-3 text-left ${
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
                </button>
              </li>
            ))}
            {!filtered.length ? (
              <li className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
                No records match that search.
              </li>
            ) : null}
          </ul>
        </div>

        {selected ? (
          <aside className={`${focus === "list" ? "hidden lg:block" : ""} rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6 lg:self-start`}>
            <button
              type="button"
              onClick={() => setFocus("list")}
              className="mb-3 inline-flex min-h-10 items-center text-sm font-medium text-accent lg:hidden"
            >
              ← Back to records
            </button>
            <p className="text-[10px] tracking-wide text-muted uppercase">
              {selected.entity_type} / {selected.action.replaceAll("_", " ")}
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
            ) : selected.action === "event_updated" && selected.entity_id ? (
              <LinkButton href={`/admin/events?id=${selected.entity_id}`} className="mt-6 w-full">
                Open event
              </LinkButton>
            ) : selected.action === "team_updated" ? (
              <LinkButton href="/admin/teams" className="mt-6 w-full">
                Open teams
              </LinkButton>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
