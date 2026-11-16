"use client";

import { useActionState, useState } from "react";
import { publishDrafts } from "@/app/actions/scores";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "../ui/form-message";
import { SubmitButton } from "../submit-button";
import { LinkButton } from "../ui/button";

export function PublishForm({ draftIds }: { draftIds: string[] }) {
  const [state, action] = useActionState(publishDrafts, initialActionState);
  const [checks, setChecks] = useState([false, false, false]);
  const ready = checks.every(Boolean) && draftIds.length > 0;

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-2xl">Publish confirmation</h2>
      <input type="hidden" name="draft_ids" value={draftIds.join(",")} />
      <div className="rounded-xl bg-accent-soft p-4 text-sm text-accent">
        This will change category subtotals, overall points, and the public leaderboard for the
        selected drafts.
      </div>
      <div className="space-y-2 text-sm">
        {[
          "The source result has been reviewed.",
          "The team and category are correct.",
          "The change reason is recorded.",
        ].map((label, i) => (
          <label key={label} className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={checks[i]}
              onChange={(e) => {
                const next = [...checks];
                next[i] = e.target.checked;
                setChecks(next);
              }}
              className="size-4 accent-accent"
            />
            {label}
          </label>
        ))}
      </div>
      <FormMessage state={state} />
      <fieldset disabled={!ready} className="disabled:opacity-50">
        <SubmitButton className="w-full" variant="primary">
          Publish {draftIds.length} update{draftIds.length === 1 ? "" : "s"}
        </SubmitButton>
      </fieldset>
      {!ready ? (
        <p className="text-xs text-muted">Check all boxes to enable publishing.</p>
      ) : null}
      <LinkButton href="/admin/leaderboards" variant="secondary" className="w-full">
        Return to editing
      </LinkButton>
    </form>
  );
}
