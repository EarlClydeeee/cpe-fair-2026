"use client";

import { useActionState, useEffect, useState } from "react";
import {
  clearSeasonContent,
  revokeInvitation,
  updateAdminRole,
} from "@/app/actions/access";
import { initialActionState } from "@/lib/action-state";
import { roleLabel, type AdminRole } from "@/lib/roles";
import {
  CLEAR_SEASON_PHRASE_1,
  CLEAR_SEASON_PHRASE_2,
} from "@/lib/validation/access";
import { FormMessage } from "../ui/form-message";
import { TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";
import { Badge } from "../ui/badge";

const roleHelp: Record<AdminRole, string> = {
  owner: "All fair content, publishing, and administrator access.",
  site_admin: "Events, teams, and public page content.",
  scoring_admin:
    "Can edit category scores, save drafts, and publish leaderboard updates. Cannot wipe season data or change access roles.",
  events_editor: "Fixtures, venues, schedules, and event status.",
};

export function AccessPanel({
  profiles,
  invites,
  isOwner,
}: {
  profiles: {
    id: string;
    full_name: string;
    email: string | null;
    role: AdminRole | null;
  }[];
  invites: { id: string; email: string; role: AdminRole; status: string }[];
  isOwner: boolean;
}) {
  const [roleState, roleAction] = useActionState(updateAdminRole, initialActionState);
  const [revokeState, revokeAction] = useActionState(revokeInvitation, initialActionState);
  const [wipeState, wipeAction] = useActionState(clearSeasonContent, initialActionState);
  const [wipeStep, setWipeStep] = useState<1 | 2>(1);
  const [phrase1, setPhrase1] = useState("");
  const [phrase2, setPhrase2] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminRole>>(() =>
    Object.fromEntries(
      profiles
        .filter((profile) => profile.role)
        .map((profile) => [profile.id, profile.role as AdminRole]),
    ),
  );

  useEffect(() => {
    if (wipeState.ok) {
      setWipeStep(1);
      setPhrase1("");
      setPhrase2("");
    }
  }, [wipeState.ok, wipeState.message]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Active admins", String(profiles.length).padStart(2, "0")],
            ["Access roles", "04"],
            [
              "Workspace owner",
              String(profiles.filter((p) => p.role === "owner").length).padStart(2, "0"),
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-[10px] tracking-wide text-muted uppercase">{label}</p>
              <p className="mt-1 font-display text-3xl">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[1.5fr_1fr_100px_120px] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
            <span>Member</span>
            <span>Role</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="grid grid-cols-[1.5fr_1fr_100px_120px] items-center gap-2 border-b border-border/60 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{profile.full_name || "Unnamed"}</p>
                <p className="text-xs text-muted">{profile.email}</p>
              </div>
              <span>{roleDrafts[profile.id] ? roleLabel(roleDrafts[profile.id]) : "—"}</span>
              <Badge tone="success">Active</Badge>
              <div>
                {isOwner && profile.role !== "owner" ? (
                  <form action={roleAction} className="flex gap-1">
                    <input type="hidden" name="profile_id" value={profile.id} />
                    <select
                      name="role"
                      value={roleDrafts[profile.id] ?? profile.role ?? "site_admin"}
                      onChange={(event) =>
                        setRoleDrafts((current) => ({
                          ...current,
                          [profile.id]: event.target.value as AdminRole,
                        }))
                      }
                      className="rounded border border-border bg-surface-2 px-1 py-1 text-xs text-foreground"
                    >
                      <option value="site_admin">Site admin</option>
                      <option value="scoring_admin">Scoring admin</option>
                      <option value="events_editor">Events editor</option>
                      <option value="owner">Owner</option>
                    </select>
                    <SubmitButton variant="ghost" className="h-7 px-2 text-xs">
                      Save
                    </SubmitButton>
                  </form>
                ) : (
                  <span className="text-xs text-muted">Owner</span>
                )}
              </div>
            </div>
          ))}
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="grid grid-cols-[1.5fr_1fr_100px_120px] items-center gap-2 border-b border-border/60 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-muted">Invitation</p>
              </div>
              <span>{roleLabel(invite.role)}</span>
              <Badge tone="accent">Pending</Badge>
              {isOwner ? (
                <form action={revokeAction}>
                  <input type="hidden" name="id" value={invite.id} />
                  <SubmitButton variant="ghost" className="h-7 px-2 text-xs text-accent">
                    Revoke
                  </SubmitButton>
                </form>
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
            </div>
          ))}
        </div>
        <FormMessage state={roleState} />
        <FormMessage state={revokeState} />

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-2xl">Permission guide</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(Object.keys(roleHelp) as AdminRole[]).map((role) => (
              <li key={role}>
                <p className="font-medium text-accent">{roleLabel(role)}</p>
                <p className="text-muted">{roleHelp[role]}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="rounded-2xl border border-accent/40 bg-surface p-5">
        <p className="text-[10px] font-bold tracking-[0.18em] text-accent uppercase">
          Danger zone
        </p>
        <h2 className="mt-1 font-display text-2xl">Clear season data</h2>
        {isOwner ? (
          <div className="mt-4 space-y-4">
            {wipeStep === 1 ? (
              <>
                <p className="text-sm leading-6 text-muted">
                  Permanently deletes teams, categories, competitions, events, scores,
                  drafts, invitations, and audit history for this fair. Schema, grants,
                  the active season row, and admin login stay intact.
                </p>
                <p className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs leading-5 text-foreground">
                  Step 1 of 2 — type{" "}
                  <span className="font-mono font-semibold text-accent">
                    {CLEAR_SEASON_PHRASE_1}
                  </span>{" "}
                  to continue.
                </p>
                <TextField
                  label="Confirmation phrase"
                  name="confirm_phrase_1_preview"
                  value={phrase1}
                  onChange={(event) => setPhrase1(event.target.value)}
                  placeholder={CLEAR_SEASON_PHRASE_1}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  disabled={phrase1 !== CLEAR_SEASON_PHRASE_1}
                  onClick={() => setWipeStep(2)}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-accent bg-accent/10 px-4 text-sm font-semibold text-accent transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to final confirmation
                </button>
              </>
            ) : (
              <form action={wipeAction} className="space-y-4">
                <input type="hidden" name="confirm_phrase_1" value={CLEAR_SEASON_PHRASE_1} />
                <p className="text-sm leading-6 text-muted">
                  This cannot be undone. Public leaderboard and admin lists will go empty
                  until organizers add data again.
                </p>
                <p className="rounded-xl border border-accent/50 bg-accent/10 px-3 py-2 text-xs leading-5 text-accent">
                  Step 2 of 2 — type{" "}
                  <span className="font-mono font-semibold">
                    {CLEAR_SEASON_PHRASE_2}
                  </span>{" "}
                  to wipe the data.
                </p>
                <TextField
                  label="Final confirmation phrase"
                  name="confirm_phrase_2"
                  value={phrase2}
                  onChange={(event) => setPhrase2(event.target.value)}
                  placeholder={CLEAR_SEASON_PHRASE_2}
                  autoComplete="off"
                  spellCheck={false}
                  error={wipeState.errors?.confirm_phrase_2?.[0]}
                />
                <TextField
                  label="Re-enter access code"
                  name="confirm_access_code"
                  type="password"
                  autoComplete="current-password"
                  required
                  error={wipeState.errors?.confirm_access_code?.[0]}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWipeStep(1);
                      setPhrase2("");
                    }}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-muted transition hover:text-foreground"
                  >
                    Back
                  </button>
                  <SubmitButton
                    variant="danger"
                    className="flex-1"
                    disabled={phrase2 !== CLEAR_SEASON_PHRASE_2}
                  >
                    Wipe season data
                  </SubmitButton>
                </div>
              </form>
            )}
            <FormMessage state={wipeState} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Only the workspace owner can clear season data.
          </p>
        )}
      </aside>
    </div>
  );
}
