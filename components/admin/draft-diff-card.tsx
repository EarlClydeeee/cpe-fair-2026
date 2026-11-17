"use client";

import { useActionState } from "react";
import { discardDraft } from "@/app/actions/scores";
import { initialActionState } from "@/lib/action-state";
import { formatPoints } from "@/lib/format";
import { roleLabel, type AdminRole } from "@/lib/roles";
import { FormMessage } from "../ui/form-message";
import { SubmitButton } from "../submit-button";

export function DraftDiffCard({
  draftId,
  teamName,
  categoryName,
  publishedPoints,
  draftPoints,
  delta,
  reason,
  preparedByName,
  preparedByRole,
}: {
  draftId: string;
  teamName: string;
  categoryName: string;
  publishedPoints: number;
  draftPoints: number;
  delta: number;
  reason: string;
  preparedByName: string | null;
  preparedByRole: AdminRole | null;
}) {
  const [discardState, discardAction] = useActionState(discardDraft, initialActionState);
  const preparedLabel = preparedByName
    ? `${preparedByName}${preparedByRole ? ` · ${roleLabel(preparedByRole)}` : ""}`
    : "Unknown admin";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs text-muted">
          {teamName} / {categoryName} / Saved draft
        </p>
        <form action={discardAction}>
          <input type="hidden" name="draft_id" value={draftId} />
          <SubmitButton variant="ghost" className="h-8 px-2 text-xs">
            Discard
          </SubmitButton>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-[10px] tracking-wide text-muted uppercase">Published</p>
          <p className="mt-2 font-display text-4xl">{formatPoints(publishedPoints)}</p>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-4">
          <p className="text-[10px] tracking-wide text-accent uppercase">Draft</p>
          <p className="mt-2 font-display text-4xl text-accent">{formatPoints(draftPoints)}</p>
          <p className="mt-1 text-xs text-accent">
            {delta >= 0 ? "+" : ""}
            {formatPoints(delta)} points
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] tracking-wide text-muted uppercase">Reason for change</p>
        <p className="mt-1 text-sm">{reason || "No reason recorded."}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3 text-xs text-muted">
        <p>
          Prepared by <span className="text-foreground">{preparedLabel}</span>
        </p>
        <p>
          State <span className="text-foreground">Saved draft · Not public yet</span>
        </p>
      </div>

      <FormMessage state={discardState} />
    </div>
  );
}
