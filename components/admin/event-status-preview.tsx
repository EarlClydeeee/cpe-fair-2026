"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { assignEventWinner } from "@/app/actions/events";
import { initialActionState, type ActionState } from "@/lib/action-state";
import type { FairEvent } from "@/lib/data/public";
import {
  eventMatchupLabel,
  eventPreviewStatusCopy,
  eventPreviewStatusDisplay,
  getComputedEventStatus,
  type ComputedEventStatus,
} from "@/lib/events";
import {
  formatDateManila,
  formatTime,
  formatTimeRange,
} from "@/lib/format";
import { FormMessage } from "../ui/form-message";

type TeamOption = { id: string; name: string };

type PreviewStep = "upcoming" | "ongoing" | "final" | "confirm" | "saved";

const STEP_MS = 4_000;

function simulatedNowForStep(
  event: FairEvent,
  step: "upcoming" | "ongoing" | "final",
): Date {
  const start = new Date(event.start_at).getTime();
  const end = new Date(event.end_at).getTime();
  if (step === "upcoming") return new Date(start - 60_000);
  if (step === "ongoing") return new Date(start);
  return new Date(end);
}

function statusClass(status: ComputedEventStatus) {
  if (status === "upcoming") {
    return "font-display text-5xl tracking-wide text-transparent uppercase [-webkit-text-stroke:1.5px_#64748b]";
  }
  if (status === "ongoing") {
    return "font-display text-5xl tracking-wide text-accent uppercase";
  }
  return "font-display text-5xl tracking-wide text-info uppercase";
}

export function EventStatusPreview({
  event,
  teams,
  open,
  onClose,
  onWinnerSaved,
}: {
  event: FairEvent;
  teams: TeamOption[];
  open: boolean;
  onClose: () => void;
  onWinnerSaved?: (winnerTeamId: string) => void;
}) {
  const [step, setStep] = useState<PreviewStep>("upcoming");
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [savedWinnerName, setSavedWinnerName] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [saveState, setSaveState] = useState<ActionState>(initialActionState);
  const [isSaving, startSave] = useTransition();

  const clockStep: "upcoming" | "ongoing" | "final" =
    step === "confirm" || step === "saved" ? "final" : step;

  const simulatedNow = useMemo(
    () => simulatedNowForStep(event, clockStep),
    [event, clockStep],
  );

  const status = useMemo(
    () =>
      getComputedEventStatus(
        {
          start_at: event.start_at,
          end_at: event.end_at,
          status_override: "auto",
        },
        simulatedNow,
      ),
    [event.start_at, event.end_at, simulatedNow],
  );

  const matchup = eventMatchupLabel(event);
  const categoryVenue = [
    event.categories?.name?.toUpperCase(),
    event.venue?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(" / ");

  const winnerChoices = useMemo(() => {
    if (event.match_type === "head_to_head") {
      return teams.filter(
        (t) => t.id === event.team_a_id || t.id === event.team_b_id,
      );
    }
    return teams;
  }, [event, teams]);

  const selectedWinner = winnerChoices.find((t) => t.id === selectedWinnerId);
  const currentWinnerName =
    event.winner_team?.name ??
    teams.find((t) => t.id === event.winner_team_id)?.name ??
    null;

  useEffect(() => {
    if (!open) return;
    setStep("upcoming");
    setSelectedWinnerId(null);
    setSavedWinnerName("");
    setAutoPlay(true);
    setSaveState(initialActionState);
  }, [open, event.id]);

  useEffect(() => {
    if (!open || !autoPlay) return;
    if (step !== "upcoming" && step !== "ongoing") return;

    const id = window.setTimeout(() => {
      setStep((prev) => {
        if (prev === "upcoming") return "ongoing";
        if (prev === "ongoing") return "final";
        return prev;
      });
    }, STEP_MS);

    return () => window.clearTimeout(id);
  }, [open, autoPlay, step]);

  useEffect(() => {
    if (step === "final") setAutoPlay(false);
  }, [step]);

  function saveWinner() {
    if (!selectedWinner) return;
    const formData = new FormData();
    formData.set("id", event.id);
    formData.set("winner_team_id", selectedWinner.id);
    formData.set("force_final", "on");
    startSave(async () => {
      const result = await assignEventWinner(initialActionState, formData);
      setSaveState(result);
      if (result.ok) {
        setSavedWinnerName(selectedWinner.name);
        setStep("saved");
        onWinnerSaved?.(selectedWinner.id);
      }
    });
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  function replay() {
    setStep("upcoming");
    setSelectedWinnerId(null);
    setSavedWinnerName("");
    setAutoPlay(true);
  }

  function EventSummary({ showFinalBadge }: { showFinalBadge?: boolean }) {
    return (
      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
          {categoryVenue || "EVENT"}
        </p>
        <h3 className="mt-2 font-display text-3xl leading-none">{event.name}</h3>
        {matchup ? (
          <p className="mt-2 text-sm text-muted">{matchup}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {event.match_format || "All eight teams"}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">
          {formatDateManila(event.start_at)}
        </p>
        <p className="text-sm text-muted">
          {formatTimeRange(event.start_at, event.end_at)}
        </p>
        {event.venue ? (
          <p className="mt-2 text-xs text-muted">{event.venue}</p>
        ) : null}
        {showFinalBadge ? (
          <p className="mt-3 inline-flex rounded-md bg-info/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-info uppercase">
            Final
          </p>
        ) : null}
      </div>
    );
  }

  if (step === "confirm" && selectedWinner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
            Schedule automation
          </p>
          <h2 className="mt-2 font-display text-4xl">Confirm Match Winner</h2>
          <div className="mt-6">
            <EventSummary showFinalBadge />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
              Selected winner
            </p>
            <p className="mt-2 font-display text-4xl">{selectedWinner.name}</p>
            <p className="mt-3 text-sm text-muted">
              Only the selected team will be assigned as the match winner.
              Assigning a winner does not automatically publish team points.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <FormMessage state={saveState} />
            <button
              type="button"
              disabled={isSaving}
              onClick={saveWinner}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save winner"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedWinnerId(null);
              setStep("final");
            }}
            className="mt-3 w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground transition hover:bg-surface"
          >
            Choose another team
          </button>
          <p className="mt-4 text-center text-xs text-muted">
            Winner assignment is available only after the event becomes Final.
          </p>
        </div>
      </div>
    );
  }

  if (step === "saved") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
            Schedule automation
          </p>
          <h2 className="mt-2 font-display text-4xl">Winner Saved</h2>
          <div className="mt-6">
            <EventSummary showFinalBadge />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
              Confirmed winner
            </p>
            <p className="mt-2 font-display text-4xl">
              {savedWinnerName || selectedWinner?.name}
            </p>
            <p className="mt-3 text-sm text-muted">
              You can review or change this result from the completed event.
              Assigning a winner does not automatically publish team points.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
          >
            View completed event
          </button>
        </div>
      </div>
    );
  }

  const primaryLabel =
    step === "upcoming"
      ? "Advance to ongoing"
      : step === "ongoing"
        ? "Advance to final"
        : "Replay preview";

  function onPrimary() {
    if (step === "upcoming") {
      setAutoPlay(false);
      setStep("ongoing");
      return;
    }
    if (step === "ongoing") {
      setAutoPlay(false);
      setStep("final");
      return;
    }
    replay();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
          Schedule automation · Prototype
        </p>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl">
          Event Status Preview
        </h2>
        <p className="mt-2 text-sm text-muted">
          {step === "final"
            ? "Example event · Final status unlocks winner assignment."
            : "Example date · Each timed step advances after 4 seconds."}
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-5">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
            {categoryVenue || "EVENT"}
          </p>
          <h3 className="mt-2 font-display text-3xl leading-none sm:text-4xl">
            {event.name}
          </h3>
          {matchup ? (
            <p className="mt-2 text-sm text-muted">{matchup}</p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {event.match_format || "All eight teams"}
            </p>
          )}
          <p className="mt-4 text-sm text-muted">
            {formatDateManila(event.start_at)}
          </p>
          <p className="text-sm text-muted">
            {formatTimeRange(event.start_at, event.end_at)}
          </p>

          <div className="mt-5 rounded-xl bg-background px-4 py-3">
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
              Simulated local time
            </p>
            <p className="mt-1 font-display text-3xl">
              {formatTime(simulatedNow.toISOString())}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Automatic status
          </p>
          <p className={`mt-2 ${statusClass(status)}`}>
            {eventPreviewStatusDisplay(status)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {eventPreviewStatusCopy(status)}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Match winner · Admin only
          </p>
          {step === "final" ? (
            <>
              <p className="mt-2 text-sm text-muted">
                Current winner:{" "}
                <span className="text-foreground">
                  {currentWinnerName ?? "Not assigned"}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {winnerChoices.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      setSelectedWinnerId(team.id);
                      setStep("confirm");
                    }}
                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:border-accent hover:bg-accent-soft"
                  >
                    {team.name}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Choose the winning team, then confirm to save the result. Team
                points are managed separately in Leaderboards.
              </p>
            </>
          ) : (
            <>
              <div className="mt-3 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted">
                Assign winner.
              </div>
              <p className="mt-2 text-xs text-muted">
                Winner selection unlocks when the event is Final.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onPrimary}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground transition hover:bg-surface"
          >
            Back to editing
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Upcoming → Ongoing at start time → Final at end time
        </p>
      </div>
    </div>
  );
}
