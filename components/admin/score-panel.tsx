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
}) {
  const router = useRouter();
  const cellKey = `${selectedTeamId ?? ""}-${selectedCategoryId ?? ""}`;
  const initialAccumulated = Math.max(
    0,
    draftPoints !== undefined ? draftPoints - publishedPoints : 0,
  );
  const [accumulated, setAccumulated] = useState(initialAccumulated);
  const [saveState, saveAction] = useActionState(saveScoreDraft, initialActionState);
  const [discardState, discardAction] = useActionState(discardDraft, initialActionState);

  useEffect(() => {
    setAccumulated(initialAccumulated);
  }, [cellKey, initialAccumulated]);

  const draftScore = publishedPoints + accumulated;
  const previewTotal = useMemo(
    () => teamTotal - publishedPoints + draftScore,
    [teamTotal, publishedPoints, draftScore],
  );
  const delta = previewTotal - teamTotal;

  function navigateSelection(nextTeamId: string, nextCategoryId: string) {
    router.push(
      `/admin/leaderboards?team=${encodeURIComponent(nextTeamId)}&category=${encodeURIComponent(nextCategoryId)}`,
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-2xl">Edit team score</h2>
        <p className="text-xs text-muted">
          {draftId ? "Draft saved — not yet published." : "No draft for this cell."}
        </p>
      </div>
      <form action={saveAction} className="space-y-3">
        <SelectField
          label="Team"
          name="team_id"
          value={selectedTeamId}
          required
          error={saveState.errors?.team_id?.[0]}
          onChange={(e) => {
            if (!selectedCategoryId) return;
            navigateSelection(e.target.value, selectedCategoryId);
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
          error={saveState.errors?.category_id?.[0]}
          onChange={(e) => {
            if (!selectedTeamId) return;
            navigateSelection(selectedTeamId, e.target.value);
          }}
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
          key={`${cellKey}-reason`}
          defaultValue=""
          placeholder="Why is this score changing?"
          error={saveState.errors?.reason?.[0]}
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
        <SubmitButton className="w-full">Update draft</SubmitButton>
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
