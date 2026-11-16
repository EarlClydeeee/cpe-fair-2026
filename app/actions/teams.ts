"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canManageContent, requireStaff } from "@/lib/auth";
import { ensureActiveSeason } from "@/lib/data/season";
import { tags } from "@/lib/data/tags";
import { isArtworkFile, uploadTeamArtwork } from "@/lib/storage/team-artwork";
import { createClient } from "@/lib/supabase/server";
import { deleteByIdSchema, teamSchema } from "@/lib/validation/access";

export async function saveTeam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff("/admin/teams");
  if (!canManageContent(user.role)) return { ok: false, message: "Content role required." };

  const artworkFile = formData.get("artwork");
  formData.delete("artwork");

  const parsed = teamSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const season = await ensureActiveSeason(supabase);
  if (!season) {
    return {
      ok: false,
      message: "Could not create an active season. Check seasons write permissions.",
    };
  }

  const { id, ...rest } = parsed.data;
  let artwork_url = rest.artwork_url;

  if (isArtworkFile(artworkFile)) {
    const uploaded = await uploadTeamArtwork(supabase, artworkFile, rest.slug);
    if ("error" in uploaded) return { ok: false, message: uploaded.error };
    artwork_url = uploaded.url;
  }

  const row = { ...rest, artwork_url, season_id: season.id };

  let entityId = id ?? null;
  if (id) {
    const { error } = await supabase.from("competition_teams").update(row).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { data, error } = await supabase
      .from("competition_teams")
      .insert(row)
      .select("id")
      .single();
    if (error) return { ok: false, message: error.message };
    entityId = data.id;
  }

  await supabase.from("audit_log").insert({
    season_id: season.id,
    actor_id: user.id,
    action: "team_updated",
    entity_type: "team",
    entity_id: entityId,
    summary: `${id ? "Updated" : "Created"} team ${parsed.data.name}`,
    after_json: row as never,
  });

  updateTag(tags.teams);
  updateTag(tags.audit);
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath(`/teams/${parsed.data.slug}`);
  revalidatePath("/leaderboard");
  return { ok: true, message: id ? "Team saved." : "Team created." };
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
