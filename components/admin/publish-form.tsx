"use client";

import { useActionState, useState } from "react";
import { publishDrafts } from "@/app/actions/scores";
import { initialActionState } from "@/lib/action-state";
import type { ReviewChangeLine } from "@/lib/review-types";
import { FormMessage } from "../ui/form-message";
import { SubmitButton } from "../submit-button";
import { LinkButton } from "../ui/button";

export function PublishForm({
  draftIds,
  changeLines,
  canPublish,
}: {
  draftIds: string[];
  changeLines: ReviewChangeLine[];
  canPublish: boolean;
}) {
  const [state, action] = useActionState(publishDrafts, initialActionState);
  const [checks, setChecks] = useState([false, false, false]);
  const ready = canPublish && checks.every(Boolean) && draftIds.length > 0;

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-2xl">Publish confirmation</h2>
      <input type="hidden" name="draft_ids" value={draftIds.join(",")} />

      <div className="rounded-xl bg-accent-soft p-4">
        <p className="text-[10px] tracking-wide text-accent uppercase">
          Selected drafts will change
        </p>
        {draftIds.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Select at least one draft card to publish.
          </p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-accent">
            {changeLines.map((line) => (
              <li key={`${line.label}:${line.detail}`}>
                <span className="font-medium">{line.label}</span>
                <span className="text-accent/80"> — {line.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-[10px] tracking-wide text-muted uppercase">Before you publish</p>
        <div className="mt-2 space-y-2 text-sm">
          {[
            "The source result has been reviewed.",
            "The team and category are correct.",
            "The change reason is recorded.",
          ].map((label, i) => (
            <label key={label} className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={checks[i]}
                disabled={!canPublish || draftIds.length === 0}
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
      </div>

      <FormMessage state={state} />
      <fieldset disabled={!ready} className="disabled:opacity-50">
        <SubmitButton className="w-full" variant="primary">
          Publish {draftIds.length} update{draftIds.length === 1 ? "" : "s"}
        </SubmitButton>
      </fieldset>
      {!canPublish ? (
        <p className="text-xs text-muted">Scoring admin or owner role required to publish.</p>
      ) : draftIds.length === 0 ? (
        <p className="text-xs text-muted">Select drafts on the left to enable publishing.</p>
      ) : !ready ? (
        <p className="text-xs text-muted">Check all boxes to enable publishing.</p>
      ) : null}
      <LinkButton href="/admin/leaderboards" variant="secondary" className="w-full">
        Return to editing
      </LinkButton>
    </form>
  );
}
