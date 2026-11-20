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
import { formatDateManila, formatTimeRange } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { FormMessage } from "../ui/form-message";

type TeamOption = { id: string; name: string };
type PreviewStep = "status" | "confirm" | "saved";

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
  onWinnerSaved?: (winnerTeamId: string, finalScore?: string) => void;
}) {
  const now = useNow(30_000);
  const [step, setStep] = useState<PreviewStep>("status");
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [finalScoreInput, setFinalScoreInput] = useState(event.final_score ?? "");
  const [savedWinnerName, setSavedWinnerName] = useState("");
  const [savedScore, setSavedScore] = useState("");
  const [saveState, setSaveState] = useState<ActionState>(initialActionState);
  const [isSaving, startSave] = useTransition();

  const status = useMemo(
    () => getComputedEventStatus(event, now),
    [event, now],
  );
  // Winner assignment only after admin sets Status mode to Ended.
  const isFinal = event.status_override === "ended";

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
    setStep("status");
    setSelectedWinnerId(null);
    setFinalScoreInput(event.final_score ?? "");
    setSavedWinnerName("");
    setSavedScore("");
    setSaveState(initialActionState);
  }, [open, event.id, event.final_score]);

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

  function saveWinner() {
    if (!selectedWinner) return;
    const formData = new FormData();
    formData.set("id", event.id);
    formData.set("winner_team_id", selectedWinner.id);
    const trimmedScore = finalScoreInput.trim();
    formData.set("final_score", trimmedScore);
    if (isFinal) formData.set("force_final", "on");
    startSave(async () => {
      const result = await assignEventWinner(initialActionState, formData);
      setSaveState(result);
      if (result.ok) {
        setSavedWinnerName(selectedWinner.name);
        setSavedScore(trimmedScore);
        setStep("saved");
        onWinnerSaved?.(selectedWinner.id, trimmedScore);
      }
    });
  }

  function saveScoreDirectly() {
    const winnerId = event.winner_team_id || selectedWinnerId;
    if (!winnerId) return;
    const formData = new FormData();
    formData.set("id", event.id);
    formData.set("winner_team_id", winnerId);
    const trimmedScore = finalScoreInput.trim();
    formData.set("final_score", trimmedScore);
    if (isFinal) formData.set("force_final", "on");
    startSave(async () => {
      const result = await assignEventWinner(initialActionState, formData);
      setSaveState(result);
      if (result.ok) {
        setSavedScore(trimmedScore);
        onWinnerSaved?.(winnerId, trimmedScore);
      }
    });
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
        {event.final_score ? (
          <p className="mt-2 font-mono text-xs font-semibold text-accent">
            Final score: {event.final_score}
          </p>
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
            Match result
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
              This writes the winner to the public event page. Team points still
              publish from Leaderboard Control.
            </p>
          </div>
          <div className="mt-6">
            <label className="block text-xs font-semibold tracking-wider text-foreground uppercase">
              Final score <span className="font-normal text-muted lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={finalScoreInput}
              onChange={(e) => setFinalScoreInput(e.target.value)}
              placeholder="e.g. 2 - 1 or 25-21, 25-19"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted">
              Optional. Leave blank if this game has no scoring system.
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
              {isSaving ? "Saving…" : "Save winner & score"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedWinnerId(null);
              setStep("status");
            }}
            className="mt-3 w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground transition hover:bg-surface"
          >
            Choose another team
          </button>
        </div>
      </div>
    );
  }

  if (step === "saved") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
            Match result
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
            {savedScore ? (
              <p className="mt-2 font-mono text-base font-bold text-accent">
                Final score: {savedScore}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-muted">
              Public event pages now show this result. Publish category points
              from Leaderboard Control when ready.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Back to event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
          Status · Admin controlled
        </p>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl">
          Event Status
        </h2>
        <p className="mt-2 text-sm text-muted">
          Mode comes from Status mode on the event form — not a timed simulation.
        </p>

        <div className="mt-6">
          <EventSummary showFinalBadge={isFinal} />
        </div>

        <div className="mt-6">
          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Public status
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
          {isFinal ? (
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
                Choose the winning team, then confirm to publish the result on
                the public event page.
              </p>

              {/* Final Score Section placed directly below */}
              <div className="mt-5 border-t border-border/70 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-accent uppercase">
                    Final score
                  </p>
                  <span className="text-xs text-muted">Optional</span>
                </div>

                {/* Big Visual Score Display */}
                <div className="mt-2.5 rounded-xl border border-accent/40 bg-background/90 p-4 shadow-sm">
                  <p className="text-[10px] font-bold tracking-wider text-muted uppercase">
                    Score Display
                  </p>
                  <p className="mt-1 font-mono text-3xl sm:text-5xl font-black tracking-tight text-accent">
                    {(savedScore || event.final_score)?.trim() || (
                      <span className="font-sans text-base sm:text-lg font-normal text-muted italic">
                        No score recorded
                      </span>
                    )}
                  </p>
                </div>

                {/* Score Input & Quick Save */}
                <div className="mt-3.5 space-y-2">
                  <label className="block text-xs font-semibold tracking-wide text-foreground uppercase">
                    Enter or update score
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={finalScoreInput}
                      onChange={(e) => setFinalScoreInput(e.target.value)}
                      placeholder="e.g. 2 - 1, 25-21, 25-19, or 88 - 76"
                      className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 font-mono text-base sm:text-lg font-bold text-foreground placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                    {(event.winner_team_id || selectedWinnerId) ? (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={saveScoreDirectly}
                        className="rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-black uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50 shrink-0"
                      >
                        {isSaving ? "Saving…" : "Save score"}
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">
                    Optional. Leave blank if this game has no scoring system.
                  </p>
                  <FormMessage state={saveState} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted">
                Assign winner.
              </div>
              <p className="mt-2 text-xs text-muted">
                Set Status mode to Ended on the event form, then pick who won.
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground transition hover:bg-surface"
        >
          Back to editing
        </button>
      </div>
    </div>
  );
}
