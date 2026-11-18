"use client";

import { useActionState, useState } from "react";
import { inviteAdmin, revokeInvitation, updateAdminRole } from "@/app/actions/access";
import { initialActionState } from "@/lib/action-state";
import { roleLabel, type AdminRole } from "@/lib/roles";
import { FormMessage } from "../ui/form-message";
import { SelectField, TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";
import { Badge } from "../ui/badge";

const roleHelp: Record<AdminRole, string> = {
  owner: "All fair content, publishing, and administrator access.",
  site_admin: "Events, teams, and public page content.",
  scoring_admin:
    "Can edit category scores, save drafts, and publish leaderboard updates. Cannot invite administrators or change access roles.",
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
  const [inviteState, inviteAction] = useActionState(inviteAdmin, initialActionState);
  const [roleState, roleAction] = useActionState(updateAdminRole, initialActionState);
  const [revokeState, revokeAction] = useActionState(revokeInvitation, initialActionState);
  const [selectedInviteRole, setSelectedInviteRole] = useState<AdminRole>("scoring_admin");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminRole>>(() =>
    Object.fromEntries(
      profiles
        .filter((profile) => profile.role)
        .map((profile) => [profile.id, profile.role as AdminRole]),
    ),
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Active admins", String(profiles.length).padStart(2, "0")],
            ["Pending invitation", String(invites.length).padStart(2, "0")],
            ["Access roles", "04"],
            ["Workspace owner", String(profiles.filter((p) => p.role === "owner").length).padStart(2, "0")],
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

      <aside className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl">Invite administrator</h2>
        {isOwner ? (
          <form action={inviteAction} className="mt-4 space-y-3">
            <TextField
              label="Email address"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              error={inviteState.errors?.email?.[0]}
            />
            <SelectField
              label="Role"
              name="role"
              value={selectedInviteRole}
              onChange={(e) => setSelectedInviteRole(e.target.value as AdminRole)}
              error={inviteState.errors?.role?.[0]}
            >
              <option value="scoring_admin">Scoring admin</option>
              <option value="site_admin">Site admin</option>
              <option value="events_editor">Events editor</option>
              <option value="owner">Owner</option>
            </SelectField>

            {/* Real-time permission description that updates as you change the role dropdown */}
            <div className="rounded-xl bg-accent-soft p-3 text-xs leading-5 text-accent transition-all">
              <span className="block font-semibold uppercase tracking-wider text-[10px] text-accent/80 mb-1">
                {roleLabel(selectedInviteRole)} Permissions
              </span>
              {roleHelp[selectedInviteRole]}
            </div>

            <FormMessage state={inviteState} />
            <SubmitButton className="w-full">Send invitation</SubmitButton>
            <p className="text-xs text-muted">
              Invitation preview only — no email is sent. They must sign up with this address.
            </p>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">Only the workspace owner can invite administrators.</p>
        )}
      </aside>
    </div>
  );
}
