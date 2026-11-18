"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { discardDraft, saveScoreDraft } from "@/app/actions/scores";
import { initialActionState } from "@/lib/action-state";
import { formatPoints } from "@/lib/format";
import { FormMessage } from "../ui/form-message";
import { SelectField, TextAreaField, TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";

type CompetitionOption = {
  id: string;
  name: string;
  category_id: string;
};

export function ScorePanel({
  teams,
  categories,
  competitions,
  selectedTeamId,
  selectedCategoryId,
  selectedCompetitionId,
  publishedPoints,
  teamTotal,
  draftPoints,
  draftId,
  reason = "",
}: {
  teams: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  competitions: CompetitionOption[];
  selectedTeamId?: string;
  selectedCategoryId?: string;
  selectedCompetitionId?: string;
  publishedPoints: number;
  teamTotal: number;
  draftPoints?: number;
  draftId?: string;
  reason?: string;
}) {
  const router = useRouter();
  const cellKey = `${selectedTeamId ?? ""}-${selectedCompetitionId ?? ""}`;
  const savedDraftPoints = draftPoints !== undefined ? draftPoints : publishedPoints;
  const initialAccumulated = Math.max(0, savedDraftPoints - publishedPoints);
  const [accumulated, setAccumulated] = useState(initialAccumulated);
  const [reasonValue, setReasonValue] = useState(reason);
  const [saveState, saveAction] = useActionState(saveScoreDraft, initialActionState);
  const [discardState, discardAction] = useActionState(discardDraft, initialActionState);

  const competitionsForCategory = useMemo(
    () =>
      competitions.filter((c) => c.category_id === selectedCategoryId),
    [competitions, selectedCategoryId],
  );

  useEffect(() => {
    setAccumulated(initialAccumulated);
    setReasonValue(reason);
  }, [cellKey, initialAccumulated, reason]);

  useEffect(() => {
    if (saveState.ok || discardState.ok) {
      router.refresh();
    }
  }, [saveState.ok, saveState.message, discardState.ok, discardState.message, router]);

  const draftScore = publishedPoints + accumulated;
  const previewTotal = useMemo(
    () => teamTotal - publishedPoints + draftScore,
    [teamTotal, publishedPoints, draftScore],
  );
  const delta = previewTotal - teamTotal;

  const pointsUnchanged = draftScore === savedDraftPoints;
  const reasonUnchanged = reasonValue.trim() === reason.trim();
  const canSubmit =
    Boolean(selectedTeamId && selectedCompetitionId) &&
    !(pointsUnchanged && reasonUnchanged);

  function navigateSelection(
    nextTeamId: string,
    nextCategoryId: string,
    nextCompetitionId: string,
  ) {
    const params = new URLSearchParams({
      team: nextTeamId,
      category: nextCategoryId,
      competition: nextCompetitionId,
    });
    router.push(`/admin/leaderboards?${params.toString()}`);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div>
        <h2 className="font-display text-xl sm:text-2xl">Edit team score</h2>
        <p className="text-xs text-muted">
          {draftId ? "Draft saved — not yet published." : "No draft for this cell."}
        </p>
      </div>
      {!categories.length || !competitions.length ? (
        <p className="rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">
          Create a category and at least one competition under{" "}
          <a href="/admin/categories" className="text-accent">
            Categories
          </a>{" "}
          before scoring.
        </p>
      ) : (
        <form action={saveAction} className="space-y-3">
          <SelectField
            label="Team"
            name="team_id"
            value={selectedTeamId}
            required
            error={saveState.errors?.team_id?.[0]}
            onChange={(e) => {
              if (!selectedCategoryId || !selectedCompetitionId) return;
              navigateSelection(e.target.value, selectedCategoryId, selectedCompetitionId);
            }}
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
            value={selectedCategoryId}
            required
            onChange={(e) => {
              if (!selectedTeamId) return;
              const nextCat = e.target.value;
              const firstComp =
                competitions.find((c) => c.category_id === nextCat)?.id ?? "";
              navigateSelection(selectedTeamId, nextCat, firstComp);
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Competition"
            name="competition_id"
            value={selectedCompetitionId}
            required
            error={saveState.errors?.competition_id?.[0]}
            onChange={(e) => {
              if (!selectedTeamId || !selectedCategoryId) return;
              navigateSelection(selectedTeamId, selectedCategoryId, e.target.value);
            }}
          >
            {competitionsForCategory.length === 0 ? (
              <option value="">No competitions in this category</option>
            ) : (
              competitionsForCategory.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </SelectField>
          <TextField
            label="Published score"
            name="published_display"
            value={String(publishedPoints)}
            readOnly
          />
          <TextField
            label="Score accumulated"
            name="score_accumulated"
            type="number"
            min={0}
            step={1}
            value={accumulated}
            required
            hint="Whole numbers only — added to the published score."
            error={saveState.errors?.draft_points?.[0]}
            onChange={(e) => {
              const next = Number(e.target.value);
              setAccumulated(Number.isFinite(next) ? Math.max(0, Math.trunc(next)) : 0);
            }}
          />
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
              <span className="ml-2 text-sm text-accent">
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
      )}
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
