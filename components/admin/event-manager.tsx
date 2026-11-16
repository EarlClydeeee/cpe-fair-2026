"use client";

import { useActionState, useMemo, useState } from "react";
import { archiveEvent, saveEvent } from "@/app/actions/events";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "../ui/form-message";
import { SelectField, TextAreaField, TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";
import { Badge } from "../ui/badge";

type EventRow = {
  id: string;
  title: string;
  category_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  day_number: number;
  starts_at: string;
  venue: string;
  status: string;
  notes: string;
  categories?: { name: string; slug: string } | null;
  team_a?: { name: string } | null;
  team_b?: { name: string } | null;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventManager({
  events,
  categories,
  teams,
}: {
  events: EventRow[];
  categories: { id: string; name: string }[];
  teams: { id: string; name: string }[];
}) {
  const [selectedId, setSelectedId] = useState(events[0]?.id);
  const [query, setQuery] = useState("");
  const selected = useMemo(
    () => events.find((e) => e.id === selectedId) ?? events[0],
    [events, selectedId],
  );
  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(query.toLowerCase()),
  );
  const [saveState, saveAction] = useActionState(saveEvent, initialActionState);
  const [archiveState, archiveAction] = useActionState(archiveEvent, initialActionState);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search event..."
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {filtered.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedId(event.id)}
              className={`flex w-full items-start justify-between gap-3 border-b border-border/60 px-4 py-3 text-left ${
                selected?.id === event.id ? "bg-accent-soft" : "hover:bg-surface-2"
              }`}
            >
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted">
                  {event.categories?.name}
                  {event.team_a && event.team_b
                    ? ` · ${event.team_a.name} vs ${event.team_b.name}`
                    : ""}
                </p>
              </div>
              <Badge
                tone={
                  event.status === "in_progress"
                    ? "accent"
                    : event.status === "final"
                      ? "info"
                      : "muted"
                }
              >
                {event.status.replaceAll("_", " ")}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl">{selected ? "Edit event" : "Add event"}</h2>
        <form action={saveAction} className="mt-4 space-y-3">
          {selected ? <input type="hidden" name="id" value={selected.id} /> : null}
          <TextField label="Event name" name="title" defaultValue={selected?.title} required />
          <SelectField label="Category" name="category_id" defaultValue={selected?.category_id} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Team A" name="team_a_id" defaultValue={selected?.team_a_id ?? ""}>
              <option value="">None / all</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Team B" name="team_b_id" defaultValue={selected?.team_b_id ?? ""}>
              <option value="">None / all</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Day"
              name="day_number"
              type="number"
              defaultValue={selected?.day_number ?? 1}
              required
            />
            <TextField
              label="Start time"
              name="starts_at"
              type="datetime-local"
              defaultValue={selected ? toLocalInput(selected.starts_at) : ""}
              required
            />
          </div>
          <TextField label="Venue" name="venue" defaultValue={selected?.venue} />
          <SelectField label="Status" name="status" defaultValue={selected?.status ?? "upcoming"}>
            <option value="upcoming">Upcoming</option>
            <option value="in_progress">In progress</option>
            <option value="final">Final</option>
            <option value="archived">Archived</option>
          </SelectField>
          <TextAreaField label="Notes" name="notes" defaultValue={selected?.notes} />
          <p className="text-xs text-muted">
            Points are managed in Leaderboards. Marking an event final does not publish scores.
          </p>
          <FormMessage state={saveState} />
          <SubmitButton className="w-full">Save event</SubmitButton>
        </form>
        {selected ? (
          <form action={archiveAction} className="mt-3">
            <input type="hidden" name="id" value={selected.id} />
            <FormMessage state={archiveState} />
            <SubmitButton variant="ghost" className="w-full">
              Archive event
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}
