"use client";

import { useActionState } from "react";
import { discardDraft, saveScoreDraft } from "@/app/actions/scores";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "../ui/form-message";
import { SelectField, TextAreaField, TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";

export function ScorePanel({
  teams,
  categories,
  selectedTeamId,
  selectedCategoryId,
  publishedPoints,
  draftPoints,
  draftId,
  reason,
}: {
  teams: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  selectedTeamId?: string;
  selectedCategoryId?: string;
  publishedPoints: number;
  draftPoints?: number;
  draftId?: string;
  reason?: string;
}) {
  const [saveState, saveAction] = useActionState(saveScoreDraft, initialActionState);
  const [discardState, discardAction] = useActionState(discardDraft, initialActionState);
  const preview = draftPoints ?? publishedPoints;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h2 className="font-display text-2xl">Edit team score</h2>
        <p className="text-xs text-muted">
          {draftId ? "Draft saved — not yet published." : "No draft for this cell."}
        </p>
      </div>
      <form action={saveAction} className="space-y-3">
        <SelectField label="Team" name="team_id" defaultValue={selectedTeamId} required>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Category"
          name="category_id"
          defaultValue={selectedCategoryId}
          required
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
          label="Draft score"
          name="draft_points"
          type="number"
          defaultValue={draftPoints ?? publishedPoints}
          required
        />
        <TextAreaField
          label="Reason for change"
          name="reason"
          defaultValue={reason ?? ""}
        />
        <p className="text-sm text-muted">
          Total preview uses this category cell: published {publishedPoints} → draft {preview}
        </p>
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
