"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canManageEvents, requireStaff } from "@/lib/auth";
import { ensureActiveSeason } from "@/lib/data/season";
import { tags } from "@/lib/data/tags";
import { getComputedEventStatus } from "@/lib/events";
import { manilaIsoFromParts } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  assignWinnerSchema,
  deleteByIdSchema,
  eventSchema,
} from "@/lib/validation/access";

function revalidateEventPaths(eventId?: string | null) {
  updateTag(tags.events);
  updateTag(tags.audit);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function saveEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/events");
  if (!canManageEvents(user.role)) {
    return { ok: false, message: "Events role required." };
  }

  const parsed = eventSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const data = parsed.data;
  let start_at: string;
  let end_at: string;
  try {
    start_at = manilaIsoFromParts(
      data.event_date,
      String(data.start_hour),
      data.start_minute,
      data.start_period,
    );
    end_at = manilaIsoFromParts(
      data.event_date,
      String(data.end_hour),
      data.end_minute,
      data.end_period,
    );
  } catch {
    return { ok: false, message: "Use a valid schedule window." };
  }

  if (new Date(end_at).getTime() <= new Date(start_at).getTime()) {
    return { ok: false, message: "End time must be after start time." };
  }

  const supabase = await createClient();
  const season = await ensureActiveSeason(supabase);
  if (!season) {
    return {
      ok: false,
      message: "Could not create an active season. Check seasons write permissions.",
    };
  }

  const match_type = data.match_type;
  const team_a_id = match_type === "all_teams" ? null : data.team_a_id;
  const team_b_id = match_type === "all_teams" ? null : data.team_b_id;

  const row = {
    season_id: season.id,
    name: data.name,
    category_id: data.category_id,
    match_type,
    team_a_id,
    team_b_id,
    start_at,
    end_at,
    venue: data.venue,
    match_format: data.match_format,
    result_note: data.result_note,
    is_highlighted: data.is_highlighted,
    status_override: data.status_override,
    is_archived: false,
  };

  if (data.is_highlighted) {
    let clearQ = supabase
      .from("events")
      .update({ is_highlighted: false })
      .eq("season_id", season.id)
      .eq("is_highlighted", true);
    if (data.id) clearQ = clearQ.neq("id", data.id);
    const { error: clearError } = await clearQ;
    if (clearError) return { ok: false, message: clearError.message };
  }

  let entityId = data.id ?? null;

  if (data.id) {
    const { error } = await supabase.from("events").update(row).eq("id", data.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("events")
      .insert(row)
      .select("id")
      .single();
    if (error) return { ok: false, message: error.message };
    entityId = inserted?.id ?? null;
  }

  await supabase.from("audit_log").insert({
    season_id: season.id,
    actor_id: user.id,
    action: "event_updated",
    entity_type: "event",
    entity_id: entityId,
    summary: `${data.id ? "Updated" : "Created"} event ${data.name}`,
    after_json: row as never,
  });

  revalidateEventPaths(entityId);
  return { ok: true, message: "Event saved." };
}

export async function archiveEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/events");
  if (!canManageEvents(user.role)) {
    return { ok: false, message: "Events role required." };
  }

  const parsed = deleteByIdSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const season = await ensureActiveSeason(supabase);

  const { data: existing, error: loadError } = await supabase
    .from("events")
    .select("id, name, season_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (loadError) return { ok: false, message: loadError.message };
  if (!existing) return { ok: false, message: "Event not found." };

  const { error } = await supabase
    .from("events")
    .update({ is_archived: true, is_highlighted: false })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_log").insert({
    season_id: season?.id ?? existing.season_id,
    actor_id: user.id,
    action: "event_updated",
    entity_type: "event",
    entity_id: existing.id,
    summary: `Archived event ${existing.name}`,
    after_json: { is_archived: true, is_highlighted: false } as never,
  });

  revalidateEventPaths(existing.id);
  return { ok: true, message: "Event archived." };
}

export async function assignEventWinner(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/events");
  if (!canManageEvents(user.role)) {
    return { ok: false, message: "Events role required." };
  }

  const parsed = assignWinnerSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("events")
    .select("*")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (loadError) return { ok: false, message: loadError.message };
  if (!existing) return { ok: false, message: "Event not found." };
  if (existing.is_archived) {
    return { ok: false, message: "Archived events cannot be updated." };
  }

  const status = getComputedEventStatus(existing);
  const isFinal =
    status === "ended" || existing.status_override === "ended";
  if (!isFinal && !parsed.data.force_final) {
    return {
      ok: false,
      message:
        "Winner assignment is available only after the event becomes Final.",
    };
  }

  const winnerId = parsed.data.winner_team_id;
  if (existing.match_type === "head_to_head") {
    if (
      winnerId !== existing.team_a_id &&
      winnerId !== existing.team_b_id
    ) {
      return { ok: false, message: "Winner must be Team A or Team B." };
    }
  } else {
    const { data: team, error: teamError } = await supabase
      .from("competition_teams")
      .select("id")
      .eq("id", winnerId)
      .eq("season_id", existing.season_id)
      .eq("visibility", "active")
      .maybeSingle();
    if (teamError) return { ok: false, message: teamError.message };
    if (!team) {
      return { ok: false, message: "Winner must be an active team." };
    }
  }

  const { error } = await supabase
    .from("events")
    .update({
      winner_team_id: winnerId,
      status_override: "ended",
    })
    .eq("id", existing.id);
  if (error) return { ok: false, message: error.message };

  const { data: winnerTeam } = await supabase
    .from("competition_teams")
    .select("name")
    .eq("id", winnerId)
    .maybeSingle();

  await supabase.from("audit_log").insert({
    season_id: existing.season_id,
    actor_id: user.id,
    action: "event_updated",
    entity_type: "event",
    entity_id: existing.id,
    summary: `Assigned winner ${winnerTeam?.name ?? winnerId} for ${existing.name}`,
    after_json: {
      winner_team_id: winnerId,
      status_override: "ended",
    } as never,
  });

  revalidateEventPaths(existing.id);
  return { ok: true, message: "Winner saved." };
}
