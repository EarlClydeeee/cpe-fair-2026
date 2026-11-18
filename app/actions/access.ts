"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { requireOwner } from "@/lib/auth";
import { getActiveSeason } from "@/lib/data/public";
import { tags } from "@/lib/data/tags";
import { hasServiceRole } from "@/lib/supabase/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  clearSeasonContentSchema,
  inviteAdminSchema,
  revokeInviteSchema,
  updateRoleSchema,
} from "@/lib/validation/access";

export async function inviteAdmin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owner = await requireOwner();
  const parsed = inviteAdminSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("admin_invitations").insert({
    email: parsed.data.email,
    role: parsed.data.role,
    invited_by: owner.id,
    status: "pending",
  });

  if (error) return { ok: false, message: error.message };

  const season = await getActiveSeason();
  await supabase.from("audit_log").insert({
    season_id: season?.id,
    actor_id: owner.id,
    action: "admin_invited",
    entity_type: "invitation",
    summary: `Invited ${parsed.data.email} as ${parsed.data.role}`,
    after_json: parsed.data as never,
  });

  updateTag(tags.access);
  updateTag(tags.audit);
  revalidatePath("/admin/access");
  return {
    ok: true,
    message: "Invitation recorded. Have them sign up with this email (no email is sent).",
  };
}

export async function updateAdminRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owner = await requireOwner();
  const parsed = updateRoleSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.profile_id);

  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_log").insert({
    actor_id: owner.id,
    action: "role_changed",
    entity_type: "profile",
    entity_id: parsed.data.profile_id,
    summary: `Role set to ${parsed.data.role}`,
    after_json: parsed.data as never,
  });

  updateTag(tags.access);
  revalidatePath("/admin/access");
  return { ok: true, message: "Role updated." };
}

export async function revokeInvitation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owner = await requireOwner();
  const parsed = revokeInviteSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("admin_invitations")
    .update({ status: "revoked" })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_log").insert({
    actor_id: owner.id,
    action: "invitation_revoked",
    entity_type: "invitation",
    entity_id: parsed.data.id,
    summary: "Invitation revoked",
  });

  revalidatePath("/admin/access");
  return { ok: true, message: "Invitation revoked." };
}

export async function clearSeasonContent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const parsed = clearSeasonContentSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  if (!hasServiceRole) {
    return {
      ok: false,
      message:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local before wiping season data.",
    };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("clear_season_content");
  if (error) return { ok: false, message: error.message };

  updateTag(tags.season);
  updateTag(tags.teams);
  updateTag(tags.events);
  updateTag(tags.scores);
  updateTag(tags.drafts);
  updateTag(tags.audit);
  updateTag(tags.access);
  revalidatePath("/admin");
  revalidatePath("/admin/access");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/events");
  revalidatePath("/admin/leaderboards");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/teams");
  revalidatePath("/events");

  return {
    ok: true,
    message:
      "Season data wiped. Teams, categories, competitions, events, and scores are gone. Schema, grants, and admin login were kept.",
  };
}
