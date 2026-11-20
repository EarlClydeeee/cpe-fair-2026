"use client";

import { useActionState, useState } from "react";
import { revertPublishedScore } from "@/app/actions/scores";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function RevertScoreForm({
  auditId,
  fromLabel,
  toLabel,
}: {
  auditId: string;
  fromLabel: string;
  toLabel: string;
}) {
  const [state, action] = useActionState(revertPublishedScore, initialActionState);
  const [accessCode, setAccessCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const ready = confirmed && accessCode.trim().length > 0;

  return (
    <form action={action} className="mt-6 space-y-3 rounded-xl border border-border bg-surface-2 p-4">
      <input type="hidden" name="audit_id" value={auditId} />
      <p className="text-[10px] tracking-wide text-muted uppercase">Revert this publish</p>
      <p className="text-sm leading-5 text-foreground">
        Restore the live score from <span className="font-semibold">{fromLabel}</span> back to{" "}
        <span className="font-semibold">{toLabel}</span>. Only works if nothing newer has
        changed this competition score.
      </p>
      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 size-4 accent-accent"
        />
        <span>I reviewed this history record and want to undo the publish.</span>
      </label>
      <TextField
        label="Re-enter access code"
        name="confirm_access_code"
        type="password"
        autoComplete="current-password"
        value={accessCode}
        onChange={(event) => setAccessCode(event.target.value)}
        required
        error={state.errors?.confirm_access_code?.[0]}
      />
      <FormMessage state={state} />
      <fieldset disabled={!ready} className="disabled:opacity-50">
        <SubmitButton className="w-full" variant="secondary">
          Revert to {toLabel}
        </SubmitButton>
      </fieldset>
    </form>
  );
}
