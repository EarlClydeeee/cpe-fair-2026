"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { archiveEvent, saveEvent } from "@/app/actions/events";
import { EventStatusPreview } from "@/components/admin/event-status-preview";
import { initialActionState } from "@/lib/action-state";
import type { FairEvent } from "@/lib/data/public";
import {
  eventAdminStatusDisplay,
  eventMatchupLabel,
  eventStatusTone,
  eventWinnerLabel,
  getComputedEventStatus,
  type ComputedEventStatus,
} from "@/lib/events";
import {
  formatEventWindow,
  manilaDateInputValue,
  manilaTwelveHour,
} from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { FormMessage } from "../ui/form-message";
import { SelectField, TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";
import { Badge } from "../ui/badge";

const NEW_EVENT = "new" as const;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

type CategoryOption = { id: string; name: string; slug?: string };
type TeamOption = { id: string; name: string };

function TimeFields({
  prefix,
  label,
  defaults,
}: {
  prefix: "start" | "end";
  label: string;
  defaults: { hour: string; minute: string; period: "AM" | "PM" };
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </legend>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <select
          name={`${prefix}_hour`}
          defaultValue={defaults.hour}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm"
          required
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          name={`${prefix}_minute`}
          defaultValue={defaults.minute}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm"
          required
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          {!MINUTES.includes(defaults.minute) ? (
            <option value={defaults.minute}>{defaults.minute}</option>
          ) : null}
        </select>
        <select
          name={`${prefix}_period`}
          defaultValue={defaults.period}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm"
          required
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </fieldset>
  );
}

export function EventManager({
  events,
  categories,
  teams,
}: {
  events: FairEvent[];
  categories: CategoryOption[];
  teams: TeamOption[];
}) {
  const now = useNow(30_000);
  const [selectedId, setSelectedId] = useState<string>(
    events[0]?.id ?? NEW_EVENT,
  );
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ComputedEventStatus>(
    "all",
  );
  const [matchType, setMatchType] = useState<"head_to_head" | "all_teams">(
    "head_to_head",
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const isCreating = selectedId === NEW_EVENT;
  const selected = useMemo(
    () => (isCreating ? undefined : events.find((e) => e.id === selectedId)),
    [events, selectedId, isCreating],
  );

  const formKey = selected?.id ?? NEW_EVENT;

  const syncSelection = (event?: FairEvent) => {
    setMatchType(event?.match_type ?? "head_to_head");
  };

  useEffect(() => {
    setMatchType(selected?.match_type ?? "head_to_head");
  }, [formKey, selected?.match_type]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const status = getComputedEventStatus(event, now);
      if (categoryFilter !== "all" && event.category_id !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        event.name,
        event.categories?.name,
        event.team_a?.name,
        event.team_b?.name,
        event.winner_team?.name,
        event.venue,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, query, categoryFilter, statusFilter, now]);

  const [saveState, saveAction] = useActionState(saveEvent, initialActionState);
  const [archiveState, archiveAction] = useActionState(
    archiveEvent,
    initialActionState,
  );

  const startDefaults = selected
    ? manilaTwelveHour(selected.start_at)
    : { hour: "3", minute: "30", period: "PM" as const };
  const endDefaults = selected
    ? manilaTwelveHour(selected.end_at)
    : { hour: "5", minute: "30", period: "PM" as const };

  const selectedStatus = selected
    ? getComputedEventStatus(selected, now)
    : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search event or team..."
            className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | ComputedEventStatus)
            }
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="ended">Ended</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSelectedId(NEW_EVENT);
              syncSelection();
            }}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              isCreating
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface-2 text-foreground hover:bg-surface"
            }`}
          >
            + Add event
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[1.6fr_1.3fr_0.8fr_1fr] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
            <span>Event</span>
            <span>Schedule</span>
            <span>Venue</span>
            <span>Status</span>
          </div>
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted">
              No events match these filters.
            </p>
          ) : (
            filtered.map((event) => {
              const status = getComputedEventStatus(event, now);
              const matchup = eventMatchupLabel(event);
              const winner = eventWinnerLabel(event);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(event.id);
                    syncSelection(event);
                  }}
                  className={`grid w-full grid-cols-[1.6fr_1.3fr_0.8fr_1fr] items-start gap-2 border-b border-border/60 px-4 py-3 text-left text-sm ${
                    selected?.id === event.id
                      ? "bg-accent-soft"
                      : "hover:bg-surface-2"
                  }`}
                >
                  <span>
                    <span className="font-medium">{event.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {event.categories?.name}
                      {matchup ? ` · ${matchup}` : ""}
                    </span>
                    {winner ? (
                      <span className="mt-1 block text-xs text-info">{winner}</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted">
                    {formatEventWindow(event.start_at, event.end_at)}
                  </span>
                  <span className="text-xs text-muted">{event.venue || "—"}</span>
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={eventStatusTone(status)}>
                      {eventAdminStatusDisplay(status)}
                    </Badge>
                    {event.is_highlighted ? (
                      <Badge tone="accent">Spotlight</Badge>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl">
          {isCreating ? "Create event" : "Edit event"}
        </h2>
        <form
          key={formKey}
          action={saveAction}
          className="mt-4 space-y-4"
          onChange={(e) => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
              return;
            }
            if (
              target.name === "match_type" &&
              (target.value === "head_to_head" || target.value === "all_teams")
            ) {
              setMatchType(target.value);
            }
          }}
        >
          {selected ? <input type="hidden" name="id" value={selected.id} /> : null}

          <section className="space-y-3">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
              Basic details
            </p>
            <TextField
              label="Event name"
              name="name"
              defaultValue={selected?.name}
              required
            />
            <SelectField
              label="Category"
              name="category_id"
              defaultValue={selected?.category_id ?? categories[0]?.id}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium tracking-wide text-muted uppercase">
                Matchup type
              </legend>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="match_type"
                    value="head_to_head"
                    defaultChecked={matchType === "head_to_head"}
                  />
                  Head-to-Head
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="match_type"
                    value="all_teams"
                    defaultChecked={matchType === "all_teams"}
                  />
                  All Eight Teams
                </label>
              </div>
            </fieldset>

            {matchType === "head_to_head" ? (
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Team A"
                  name="team_a_id"
                  defaultValue={selected?.team_a_id ?? ""}
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Team B"
                  name="team_b_id"
                  defaultValue={selected?.team_b_id ?? ""}
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            ) : (
              <>
                <input type="hidden" name="team_a_id" value="" />
                <input type="hidden" name="team_b_id" value="" />
              </>
            )}

            <TextField
              label="Venue"
              name="venue"
              defaultValue={selected?.venue ?? ""}
            />
            <TextField
              label="Match format"
              name="match_format"
              defaultValue={selected?.match_format ?? ""}
              placeholder="Best of three"
            />
          </section>

          <section className="space-y-3">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
              Schedule window
            </p>
            <TextField
              label="Date"
              name="event_date"
              type="date"
              defaultValue={
                selected
                  ? manilaDateInputValue(selected.start_at)
                  : "2026-11-23"
              }
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TimeFields prefix="start" label="Start time" defaults={startDefaults} />
              <TimeFields prefix="end" label="End time" defaults={endDefaults} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
              Spotlight & status
            </p>
            <label className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 px-3 py-3 text-sm">
              <input
                type="checkbox"
                name="is_highlighted"
                defaultChecked={selected?.is_highlighted ?? false}
                className="mt-0.5 size-4 rounded border-border accent-accent"
              />
              <span>
                <span className="font-medium text-foreground">
                  Pin as Highlighted Event
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Overrides automatic selection on the public Events hero banner
                  and Leaderboard spotlight.
                </span>
              </span>
            </label>
            <SelectField
              label="Status mode"
              name="status_override"
              defaultValue={selected?.status_override ?? "auto"}
            >
              <option value="auto">Auto (Time-based)</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="ended">Ended</option>
            </SelectField>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
              Match result
            </p>
            <div className="rounded-lg border border-border bg-surface-2 px-3 py-3 text-sm">
              <p className="text-xs tracking-wide text-muted uppercase">Winner</p>
              <p className="mt-1 font-medium">
                {selected?.winner_team?.name ?? "Not assigned"}
              </p>
              <p className="mt-2 text-xs text-muted">
                Winner selection unlocks in Status Preview when the event is
                Final. Assigning a winner does not publish team points —
                update scores in Leaderboard Control.
              </p>
            </div>
            <TextField
              label="Score / Result note"
              name="result_note"
              defaultValue={selected?.result_note ?? ""}
              placeholder="2-1 or 25-21, 25-19"
            />
          </section>

          <FormMessage state={saveState} />
          <SubmitButton className="w-full">Save event</SubmitButton>
        </form>

        {selected ? (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="w-full rounded-lg border border-accent/40 bg-accent-soft px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-accent"
            >
              Preview status
              {selectedStatus === "ended" ? " · Assign winner" : ""}
            </button>
            <form action={archiveAction}>
              <input type="hidden" name="id" value={selected.id} />
              <FormMessage state={archiveState} />
              <SubmitButton variant="ghost" className="w-full">
                Archive event
              </SubmitButton>
            </form>
          </div>
        ) : null}
      </div>

      {selected ? (
        <EventStatusPreview
          event={selected}
          teams={teams}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </div>
  );
}
