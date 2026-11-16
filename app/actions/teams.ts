"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canManageContent, requireStaff } from "@/lib/auth";
import { getActiveSeason } from "@/lib/data/public";
import { tags } from "@/lib/data/tags";
import { createClient } from "@/lib/supabase/server";
import { deleteByIdSchema, teamSchema } from "@/lib/validation/access";

export async function saveTeam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff("/admin/teams");
  if (!canManageContent(user.role)) return { ok: false, message: "Content role required." };

  const parsed = teamSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const season = await getActiveSeason();
  if (!season) return { ok: false, message: "No active season." };

  const { id, ...rest } = parsed.data;
  const row = { ...rest, season_id: season.id };
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("competition_teams").update(row).eq("id", id)
    : await supabase.from("competition_teams").insert(row);

  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_log").insert({
    season_id: season.id,
    actor_id: user.id,
    action: "team_updated",
    entity_type: "team",
    entity_id: id ?? null,
    summary: `${id ? "Updated" : "Created"} team ${parsed.data.name}`,
    after_json: row as never,
  });

  updateTag(tags.teams);
  updateTag(tags.audit);
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath(`/teams/${parsed.data.slug}`);
  revalidatePath("/leaderboard");
  return { ok: true, message: "Team saved." };
}

export async function archiveTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/teams");
  if (!canManageContent(user.role)) return { ok: false, message: "Content role required." };

  const parsed = deleteByIdSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("competition_teams")
    .update({ visibility: "archived" })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: error.message };

  updateTag(tags.teams);
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  return { ok: true, message: "Team archived." };
}
