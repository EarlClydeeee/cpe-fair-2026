"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  archiveEvent,
  clearEventWinner,
  saveEvent,
} from "@/app/actions/events";
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
  manilaIsoFromParts,
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
type CompetitionOption = { id: string; name: string; category_id: string };
type TeamOption = { id: string; name: string; color_hex?: string };

export function EventManager({
  events,
  categories,
  competitions,
  teams,
  initialStatusFilter = "all",
  initialSelectedId,
}: {
  events: FairEvent[];
  categories: CategoryOption[];
  competitions: CompetitionOption[];
  teams: TeamOption[];
  initialStatusFilter?: string;
  initialSelectedId?: string;
}) {
  const router = useRouter();
  const now = useNow(30_000);

  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedId ?? events[0]?.id ?? NEW_EVENT,
  );
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "upcoming" | "ongoing" | "ended" | "needs_winner" | "needs_mvp"
  >(
    initialStatusFilter === "needs_winner" ||
      initialStatusFilter === "needs_mvp" ||
      initialStatusFilter === "upcoming" ||
      initialStatusFilter === "ongoing" ||
      initialStatusFilter === "ended"
      ? initialStatusFilter
      : "all",
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [focus, setFocus] = useState<"list" | "editor">(
    initialSelectedId ? "editor" : "list",
  );

  const isCreating = selectedId === NEW_EVENT;
  const selected = useMemo(
    () => (isCreating ? undefined : events.find((e) => e.id === selectedId)),
    [events, selectedId, isCreating],
  );

  // Controlled real-time form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formCompetitionId, setFormCompetitionId] = useState("");
  const [matchType, setMatchType] = useState<"head_to_head" | "all_teams">(
    "head_to_head",
  );
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [venue, setVenue] = useState("");
  const [matchFormat, setMatchFormat] = useState("");
  const [eventDate, setEventDate] = useState("2026-11-23");
  const [startHour, setStartHour] = useState("3");
  const [startMinute, setStartMinute] = useState("30");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("PM");
  const [endHour, setEndHour] = useState("5");
  const [endMinute, setEndMinute] = useState("30");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [statusMode, setStatusMode] = useState<"upcoming" | "ongoing" | "ended">(
    "upcoming",
  );
  const [winnerTeamId, setWinnerTeamId] = useState("");
  const [resultNote, setResultNote] = useState("");
  const [finalScore, setFinalScore] = useState("");
  const [mvpTitle, setMvpTitle] = useState("");

  // Populate controlled state whenever selected event changes
  useEffect(() => {
    if (selected) {
      setName(selected.name);
      const nextCategoryId = selected.category_id;
      setCategoryId(nextCategoryId);
      const comps = competitions.filter((c) => c.category_id === nextCategoryId);
      setFormCompetitionId(
        selected.competition_id &&
          comps.some((c) => c.id === selected.competition_id)
          ? selected.competition_id
          : (comps[0]?.id ?? ""),
      );
      setMatchType(selected.match_type ?? "head_to_head");
      setTeamAId(selected.team_a_id ?? "");
      setTeamBId(selected.team_b_id ?? "");
      setVenue(selected.venue ?? "");
      setMatchFormat(selected.match_format ?? "");
      setEventDate(manilaDateInputValue(selected.start_at));

      const s = manilaTwelveHour(selected.start_at);
      setStartHour(s.hour);
      setStartMinute(s.minute);
      setStartPeriod(s.period);

      const e = manilaTwelveHour(selected.end_at);
      setEndHour(e.hour);
      setEndMinute(e.minute);
      setEndPeriod(e.period);

      setIsHighlighted(Boolean(selected.is_highlighted));
      const override = selected.status_override;
      setStatusMode(
        override === "ongoing" || override === "ended" ? override : "upcoming",
      );
      setWinnerTeamId(selected.winner_team_id ?? "");
      setResultNote(selected.result_note ?? "");
      setFinalScore(selected.final_score ?? "");
      setMvpTitle(selected.mvp_title ?? "");
    } else {
      const nextCategoryId = categories[0]?.id ?? "";
      setName("");
      setCategoryId(nextCategoryId);
      setFormCompetitionId(
        competitions.find((c) => c.category_id === nextCategoryId)?.id ?? "",
      );
      setMatchType("head_to_head");
      setTeamAId(teams[0]?.id ?? "");
      setTeamBId(teams[1]?.id ?? "");
      setVenue("Main court");
      setMatchFormat("Best of three");
      setEventDate("2026-11-23");
      setStartHour("3");
      setStartMinute("30");
      setStartPeriod("PM");
      setEndHour("5");
      setEndMinute("30");
      setEndPeriod("PM");
      setIsHighlighted(false);
      setStatusMode("upcoming");
      setWinnerTeamId("");
      setResultNote("");
      setFinalScore("");
      setMvpTitle("");
    }
  }, [selectedId, selected, categories, competitions, teams]);

  const formCompetitions = useMemo(
    () => competitions.filter((c) => c.category_id === categoryId),
    [competitions, categoryId],
  );

  const needsWinnerCount = useMemo(() => {
    return events.filter(
      (e) => e.status_override === "ended" && !e.winner_team_id,
    ).length;
  }, [events]);

  const needsMvpCount = useMemo(() => {
    return events.filter(
      (e) => e.status_override === "ended" && !e.mvp_title?.trim(),
    ).length;
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (event.id === selectedId) return true;
      const status = getComputedEventStatus(event, now);
      if (categoryFilter !== "all" && event.category_id !== categoryFilter) {
        return false;
      }
      if (statusFilter === "needs_winner") {
        if (!(event.status_override === "ended" && !event.winner_team_id)) {
          return false;
        }
      } else if (statusFilter === "needs_mvp") {
        if (!(event.status_override === "ended" && !event.mvp_title?.trim())) {
          return false;
        }
      } else if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        event.name,
        event.categories?.name,
        event.competitions?.name,
        event.mvp_title,
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
  }, [events, query, categoryFilter, statusFilter, now, selectedId]);

  const [saveState, saveAction] = useActionState(saveEvent, initialActionState);
  const [archiveState, archiveAction] = useActionState(
    archiveEvent,
    initialActionState,
  );
  const [clearWinnerState, clearWinnerAction] = useActionState(
    clearEventWinner,
    initialActionState,
  );

  useEffect(() => {
    if (saveState.ok || archiveState.ok || clearWinnerState.ok) {
      router.refresh();
    }
  }, [
    saveState.ok,
    saveState.message,
    archiveState.ok,
    archiveState.message,
    clearWinnerState.ok,
    clearWinnerState.message,
    router,
  ]);

  const canSetWinner = statusMode === "ended";

  const currentCategory = categories.find((c) => c.id === categoryId);
  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);
  const winnerTeam = teams.find((t) => t.id === winnerTeamId);

  function openEvent(id: string) {
    setSelectedId(id);
    setFocus("editor");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className={`space-y-4 ${focus === "editor" ? "hidden xl:block" : ""}`}>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
          {[
            { id: "all" as const, label: `All (${events.length})`, highlight: false },
            { id: "upcoming" as const, label: "Upcoming", highlight: false },
            { id: "ongoing" as const, label: "Ongoing", highlight: false },
            { id: "ended" as const, label: "Ended", highlight: false },
            {
              id: "needs_winner" as const,
              label: `Needs Winner${needsWinnerCount > 0 ? ` (${needsWinnerCount})` : ""}`,
              highlight: needsWinnerCount > 0,
            },
            {
              id: "needs_mvp" as const,
              label: `Needs MVP${needsMvpCount > 0 ? ` (${needsMvpCount})` : ""}`,
              highlight: needsMvpCount > 0,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? "bg-accent text-black shadow-xs"
                  : tab.highlight
                    ? "border border-info/40 bg-info/10 text-info hover:bg-info/20"
                    : "border border-border bg-surface text-muted hover:border-border hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search event, venue, or team..."
            className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted/60"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => openEvent(NEW_EVENT)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              isCreating
                ? "border-accent bg-accent-soft text-accent"
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
              const isSelected = selected?.id === event.id;
              const status = isSelected
                ? statusMode
                : getComputedEventStatus(event, now);

              const displayName = isSelected
                ? name.trim() || event.name
                : event.name;
              const displayCategory = isSelected
                ? (currentCategory?.name ?? "Category")
                : event.categories?.name;
              const displayCompetition = isSelected
                ? (formCompetitions.find((c) => c.id === formCompetitionId)
                    ?.name ?? null)
                : (event.competitions?.name ?? null);
              const displayVenue = isSelected
                ? venue.trim() || "—"
                : event.venue || "—";
              const displaySchedule = isSelected
                ? formatEventWindow(
                    manilaIsoFromParts(
                      eventDate,
                      startHour,
                      startMinute,
                      startPeriod,
                    ),
                    manilaIsoFromParts(eventDate, endHour, endMinute, endPeriod),
                  )
                : formatEventWindow(event.start_at, event.end_at);
              const spotlight = isSelected
                ? isHighlighted
                : Boolean(event.is_highlighted);
              const needsWinner = isSelected
                ? statusMode === "ended" && !winnerTeamId
                : event.status_override === "ended" && !event.winner_team_id;
              const needsMvp = isSelected
                ? statusMode === "ended" && !mvpTitle.trim()
                : event.status_override === "ended" && !event.mvp_title?.trim();
              const matchup = isSelected
                ? matchType === "head_to_head" && teamA && teamB
                  ? `${teamA.name} vs ${teamB.name}`
                  : "All eight teams"
                : eventMatchupLabel(event);

              const winner = isSelected
                ? canSetWinner && winnerTeam
                  ? `Winner: ${winnerTeam.name}`
                  : null
                : eventWinnerLabel(event);
              const mvpLabel = isSelected
                ? mvpTitle.trim() || null
                : event.mvp_title?.trim() || null;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEvent(event.id)}
                  className={`grid w-full grid-cols-[1.6fr_1.3fr_0.8fr_1fr] items-start gap-2 border-b border-border/60 px-4 py-3 text-left text-sm transition-colors ${
                    isSelected ? "bg-accent-soft" : "hover:bg-surface-2"
                  }`}
                >
                  <span className="min-w-0 pr-2">
                    <span className="block truncate font-medium">
                      {displayName}
                      {isSelected ? (
                        <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent uppercase">
                          Editing
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {displayCategory}
                      {displayCompetition ? ` · ${displayCompetition}` : ""}
                      {matchup ? ` · ${matchup}` : ""}
                    </span>
                    {winner || (isSelected ? finalScore.trim() : event.final_score?.trim()) ? (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {winner ? (
                          <span className="text-xs font-semibold text-info">
                            {winner}
                          </span>
                        ) : null}
                        {(isSelected ? finalScore.trim() : event.final_score?.trim()) ? (
                          <span className="rounded bg-surface-2 border border-border px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent">
                            Score: {isSelected ? finalScore.trim() : event.final_score?.trim()}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {mvpLabel ? (
                      <span className="mt-1 block text-xs font-semibold text-accent">
                        MVP: {mvpLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted">{displaySchedule}</span>
                  <span className="text-xs text-muted">{displayVenue}</span>
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={eventStatusTone(status as ComputedEventStatus)}>
                      {eventAdminStatusDisplay(status as ComputedEventStatus)}
                    </Badge>
                    {spotlight ? <Badge tone="accent">Spotlight</Badge> : null}
                    {needsWinner ? <Badge tone="info">Needs winner</Badge> : null}
                    {needsMvp ? <Badge tone="info">Needs MVP</Badge> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl border border-border bg-surface p-5 ${focus === "list" ? "hidden xl:block" : ""}`}
      >
        <button
          type="button"
          onClick={() => setFocus("list")}
          className="mb-3 inline-flex min-h-10 items-center text-sm font-medium text-accent xl:hidden"
        >
          ← Back to events
        </button>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">
            {isCreating ? "Create event" : "Edit event"}
          </h2>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
            Live Preview
          </span>
        </div>

        <div className="mt-3.5 rounded-xl border border-accent/30 bg-surface-2 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase">
              {currentCategory?.name ?? "CATEGORY"}
            </span>
            <div className="flex items-center gap-1.5">
              {isHighlighted ? <Badge tone="accent">Spotlight</Badge> : null}
              <Badge tone={eventStatusTone(statusMode)}>
                {eventAdminStatusDisplay(statusMode)}
              </Badge>
            </div>
          </div>

          <h3 className="mt-1.5 font-display text-2xl font-black text-foreground">
            {name.trim() || "Untitled Event"}
          </h3>

          <p className="mt-1 text-xs text-muted">
            {matchType === "head_to_head" ? (
              <span className="font-medium text-foreground">
                {teamA?.name ?? "Team A"} vs {teamB?.name ?? "Team B"}
              </span>
            ) : (
              <span>All Eight Teams</span>
            )}
            {matchFormat ? ` · ${matchFormat}` : ""}
          </p>

          <p className="mt-2 text-xs text-muted">
            {eventDate} · {startHour}:{startMinute} {startPeriod} – {endHour}:
            {endMinute} {endPeriod}
            {venue ? ` · ${venue}` : ""}
          </p>

          {canSetWinner ? (
            <div className="mt-3 space-y-1.5 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-info">
                  {winnerTeam
                    ? `Winner: ${winnerTeam.name}`
                    : "Winner: Not yet announced"}
                </span>
                {finalScore.trim() ? (
                  <span className="rounded bg-background/80 px-2 py-0.5 font-mono text-[11px] font-bold text-accent border border-accent/25">
                    Score: {finalScore.trim()}
                  </span>
                ) : null}
              </div>
              {resultNote ? (
                <span className="block text-muted">Note: {resultNote}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <form action={saveAction} className="mt-4 space-y-4">
          {selected ? <input type="hidden" name="id" value={selected.id} /> : null}

          <section className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
              Basic details
            </p>
            <TextField
              label="Event name"
              name="name"
              value={name}
              placeholder="e.g. VOLLEYBALL FINALS"
              required
              onChange={(e) => setName(e.target.value)}
            />
            <SelectField
              label="Category"
              name="category_id"
              value={categoryId}
              required
              onChange={(e) => {
                const next = e.target.value;
                setCategoryId(next);
                setFormCompetitionId(
                  competitions.find((c) => c.category_id === next)?.id ?? "",
                );
              }}
            >
              {categories.length === 0 ? (
                <option value="">No categories — create one first</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </SelectField>
            <SelectField
              label="Competition"
              name="competition_id"
              value={formCompetitionId}
              required
              error={saveState.errors?.competition_id?.[0]}
              onChange={(e) => setFormCompetitionId(e.target.value)}
            >
              {formCompetitions.length === 0 ? (
                <option value="">No competitions in this category</option>
              ) : (
                formCompetitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </SelectField>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium tracking-wide text-muted uppercase">
                Matchup type
              </legend>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="match_type"
                    value="head_to_head"
                    checked={matchType === "head_to_head"}
                    onChange={() => setMatchType("head_to_head")}
                  />
                  Head-to-Head
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="match_type"
                    value="all_teams"
                    checked={matchType === "all_teams"}
                    onChange={() => setMatchType("all_teams")}
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
                  value={teamAId}
                  required
                  onChange={(e) => setTeamAId(e.target.value)}
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
                  value={teamBId}
                  required
                  onChange={(e) => setTeamBId(e.target.value)}
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                      {t.name} {t.id === teamAId ? "(Already Team A)" : ""}
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
              value={venue}
              placeholder="e.g. Main court or Strategy hall"
              onChange={(e) => setVenue(e.target.value)}
            />
            <TextField
              label="Match format"
              name="match_format"
              value={matchFormat}
              placeholder="Best of three"
              onChange={(e) => setMatchFormat(e.target.value)}
            />
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
              Schedule window
            </p>
            <TextField
              label="Date"
              name="event_date"
              type="date"
              value={eventDate}
              required
              onChange={(e) => setEventDate(e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-medium tracking-wide text-muted uppercase">
                  Start time
                </legend>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <select
                    name="start_hour"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2.5 text-sm"
                    required
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    name="start_minute"
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2.5 text-sm"
                    required
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    name="start_period"
                    value={startPeriod}
                    onChange={(e) =>
                      setStartPeriod(e.target.value as "AM" | "PM")
                    }
                    className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2.5 text-sm"
                    required
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </fieldset>

              <fieldset className="space-y-1.5">
                <legend className="text-xs font-medium tracking-wide text-muted uppercase">
                  End time
                </legend>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <select
                    name="end_hour"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2.5 text-sm"
                    required
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    name="end_minute"
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2.5 text-sm"
                    required
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    name="end_period"
                    value={endPeriod}
                    onChange={(e) =>
                      setEndPeriod(e.target.value as "AM" | "PM")
                    }
                    className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2.5 text-sm"
                    required
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </fieldset>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
              Spotlight & status
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-2 px-3 py-3 text-sm">
              <input
                type="checkbox"
                name="is_highlighted"
                checked={isHighlighted}
                onChange={(e) => setIsHighlighted(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border accent-accent"
              />
              <span>
                <span className="font-medium text-foreground">
                  Pin as Highlighted Event (Spotlight)
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Displays on public hero banner and leaderboard spotlight.
                </span>
              </span>
            </label>

            <SelectField
              label="Status mode"
              name="status_override"
              value={statusMode}
              onChange={(e) =>
                setStatusMode(e.target.value as "upcoming" | "ongoing" | "ended")
              }
              hint="Upcoming / Ongoing have no winner. Set to Ended when finished, then choose the winner."
            >
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="ended">Ended</option>
            </SelectField>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
              Match result
            </p>
            {canSetWinner ? (
              <SelectField
                label="Winner"
                name="winner_team_id"
                value={winnerTeamId}
                onChange={(e) => setWinnerTeamId(e.target.value)}
                hint="Announces winner on public schedule. Points publish from Leaderboard Control."
              >
                <option value="">Not announced yet</option>
                {matchType === "head_to_head" && (teamA || teamB) ? (
                  <optgroup label="Match Participants">
                    {teamA ? (
                      <option value={teamA.id}>{teamA.name}</option>
                    ) : null}
                    {teamB ? (
                      <option value={teamB.id}>{teamB.name}</option>
                    ) : null}
                  </optgroup>
                ) : null}
                <optgroup
                  label={
                    matchType === "head_to_head" ? "Other Teams" : "All Teams"
                  }
                >
                  {teams
                    .filter(
                      (t) =>
                        matchType !== "head_to_head" ||
                        (t.id !== teamAId && t.id !== teamBId),
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </optgroup>
              </SelectField>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-3 text-sm">
                <p className="text-xs tracking-wide text-muted uppercase">
                  Winner
                </p>
                <p className="mt-1 text-xs text-muted">
                  Winner is only selectable after setting Status mode to Ended
                  above.
                </p>
                <input type="hidden" name="winner_team_id" value="" />
              </div>
            )}

            {canSetWinner ? (
              <TextField
                label="Final score (Optional)"
                name="final_score"
                value={finalScore}
                placeholder="e.g. 2 - 1, 25-21, 25-19, or 88 - 76 (optional)"
                onChange={(e) => setFinalScore(e.target.value)}
                hint="Optional. Leave blank if this game has no scoring system. Shown on the public match card."
              />
            ) : (
              <input type="hidden" name="final_score" value={finalScore} />
            )}
            <TextField
              label="Result note"
              name="result_note"
              value={resultNote}
              placeholder="Optional extra note"
              onChange={(e) => setResultNote(e.target.value)}
              hint="Optional. Extra context beyond the final score."
            />
            <TextField
              label="MVP title"
              name="mvp_title"
              value={mvpTitle}
              placeholder="e.g. Best Spiker · Juan Dela Cruz"
              onChange={(e) => setMvpTitle(e.target.value)}
              hint="Optional. Leave blank if this game has no MVP award."
            />
          </section>

          <FormMessage state={saveState} />
          <SubmitButton className="w-full">
            {isCreating ? "Create event" : "Save event"}
          </SubmitButton>
        </form>

        {selected ? (
          <div className="mt-3 space-y-2">
            {canSetWinner && selected.winner_team_id ? (
              <form action={clearWinnerAction}>
                <input type="hidden" name="id" value={selected.id} />
                <FormMessage state={clearWinnerState} />
                <SubmitButton variant="ghost" className="w-full">
                  Clear winner
                </SubmitButton>
              </form>
            ) : null}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="w-full rounded-lg border border-accent/40 bg-accent-soft px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-accent"
            >
              Full preview & assign winner modal
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
          onWinnerSaved={(winnerId, savedScore) => {
            setWinnerTeamId(winnerId);
            if (savedScore !== undefined) {
              setFinalScore(savedScore);
            }
            setStatusMode("ended");
            setPreviewOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}