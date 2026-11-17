"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { discardDraft, saveScoreDraft } from "@/app/actions/scores";
import { initialActionState } from "@/lib/action-state";
import { formatPoints } from "@/lib/format";
import { FormMessage } from "../ui/form-message";
import { SelectField, TextAreaField, TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";

export function ScorePanel({
  teams,
  categories,
  selectedTeamId,
  selectedCategoryId,
  publishedPoints,
  teamTotal,
  draftPoints,
  draftId,
  reason = "",
  onSelect,
  onLiveScore,
}: {
  teams: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  selectedTeamId?: string;
  selectedCategoryId?: string;
  publishedPoints: number;
  teamTotal: number;
  draftPoints?: number;
  draftId?: string;
  reason?: string;
  onSelect?: (teamId: string, categoryId: string) => void;
  onLiveScore?: (teamId: string, categoryId: string, score: number) => void;
}) {
  const router = useRouter();

  const cellKey = `${selectedTeamId ?? ""}-${selectedCategoryId ?? ""}`;
  const savedDraftPoints = draftPoints !== undefined ? draftPoints : publishedPoints;
  const initialAccumulated = Math.max(0, savedDraftPoints - publishedPoints);

  const [currentTeamId, setCurrentTeamId] = useState(selectedTeamId ?? teams[0]?.id ?? "");
  const [currentCategoryId, setCurrentCategoryId] = useState(selectedCategoryId ?? categories[0]?.id ?? "");
  const [accumulatedInput, setAccumulatedInput] = useState(String(initialAccumulated));
  const [reasonValue, setReasonValue] = useState(reason);
  const [syncedCell, setSyncedCell] = useState(cellKey);

  if (syncedCell !== cellKey) {
    setSyncedCell(cellKey);
    setCurrentTeamId(selectedTeamId ?? teams[0]?.id ?? "");
    setCurrentCategoryId(selectedCategoryId ?? categories[0]?.id ?? "");
    setAccumulatedInput(String(initialAccumulated));
    setReasonValue(reason);
  }

  const [saveState, saveAction] = useActionState(saveScoreDraft, initialActionState);
  const [discardState, discardAction] = useActionState(discardDraft, initialActionState);

  useEffect(() => {
    if (saveState.ok || discardState.ok) {
      router.refresh();
    }
  }, [saveState.ok, saveState.message, discardState.ok, discardState.message, router]);

  // Derived numeric accumulated value
  const accumulated = useMemo(() => {
    if (accumulatedInput === "" || accumulatedInput === "-") return 0;
    const parsed = Number(accumulatedInput);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }, [accumulatedInput]);

  const draftScore = publishedPoints + accumulated;
  const previewTotal = useMemo(
    () => teamTotal - publishedPoints + draftScore,
    [teamTotal, publishedPoints, draftScore],
  );
  const delta = previewTotal - teamTotal;

  const pointsUnchanged = draftScore === savedDraftPoints;
  const reasonUnchanged = reasonValue.trim() === reason.trim();
  const canSubmit = !(pointsUnchanged && reasonUnchanged);

  useEffect(() => {
    if (!currentTeamId || !currentCategoryId) return;
    onLiveScore?.(currentTeamId, currentCategoryId, draftScore);
  }, [currentTeamId, currentCategoryId, draftScore, onLiveScore]);

  function handleTeamChange(nextTeamId: string) {
    setCurrentTeamId(nextTeamId);
    if (!currentCategoryId) return;
    onSelect?.(nextTeamId, currentCategoryId);
  }

  function handleCategoryChange(nextCategoryId: string) {
    setCurrentCategoryId(nextCategoryId);
    if (!currentTeamId) return;
    onSelect?.(currentTeamId, nextCategoryId);
  }

  function addPoints(increment: number) {
    const next = accumulated + increment;
    setAccumulatedInput(String(next));
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl sm:text-2xl">Edit team score</h2>
          <p className="text-xs text-muted">
            {draftId ? "Draft saved — not yet published." : "No draft for this cell."}
          </p>
        </div>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
          Live preview
        </span>
      </div>

      <form action={saveAction} className="space-y-3">
        <SelectField
          label="Team"
          name="team_id"
          value={currentTeamId}
          required
          error={saveState.errors?.team_id?.[0]}
          onChange={(e) => handleTeamChange(e.target.value)}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Category"
          name="category_id"
          value={currentCategoryId}
          required
          error={saveState.errors?.category_id?.[0]}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Published score"
          name="published_display"
          value={String(publishedPoints)}
          readOnly
        />

        <div className="space-y-1.5">
          <TextField
            label="Score accumulated"
            name="score_accumulated"
            type="number"
            min={0}
            step={1}
            value={accumulatedInput}
            required
            hint="Whole numbers only — added to the published score."
            error={saveState.errors?.draft_points?.[0]}
            onChange={(e) => setAccumulatedInput(e.target.value)}
          />
          {/* Quick point addition pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase tracking-wider text-muted mr-1 font-semibold">Quick add:</span>
            {[5, 10, 25, 50, 100].map((pts) => (
              <button
                key={pts}
                type="button"
                onClick={() => addPoints(pts)}
                className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent"
              >
                +{pts}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAccumulatedInput("0")}
              className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted transition hover:border-border hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </div>

        <input type="hidden" name="draft_points" value={draftScore} />

        <TextField
          label="Draft score"
          name="draft_score_display"
          value={String(draftScore)}
          readOnly
          hint="Published score + score accumulated."
        />

        <TextAreaField
          label="Reason for change"
          name="reason"
          value={reasonValue}
          placeholder="Why is this score changing?"
          error={saveState.errors?.reason?.[0]}
          onChange={(e) => setReasonValue(e.target.value)}
        />

        <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
          <p className="text-[10px] tracking-wide text-muted uppercase">
            Overall total preview
          </p>
          <p className="mt-1 font-display text-2xl">
            {formatPoints(teamTotal)}
            <span className="mx-2 text-muted">→</span>
            {formatPoints(previewTotal)}
            <span className="ml-2 text-sm font-semibold text-accent">
              {delta >= 0 ? "+" : ""}
              {formatPoints(delta)} pts
            </span>
          </p>
        </div>

        <FormMessage state={saveState} />
        <SubmitButton className="w-full" disabled={!canSubmit}>
          {draftId && !canSubmit ? "Draft up to date" : "Update draft"}
        </SubmitButton>
      </form>

      {draftId ? (
        <form action={discardAction}>
          <input type="hidden" name="draft_id" value={draftId} />
          <FormMessage state={discardState} />
          <SubmitButton variant="ghost" className="w-full">
            Discard draft
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
