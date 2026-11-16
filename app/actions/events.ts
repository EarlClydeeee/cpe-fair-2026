"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canManageEvents, requireStaff } from "@/lib/auth";
import { getActiveSeason } from "@/lib/data/public";
import { tags } from "@/lib/data/tags";
import { createClient } from "@/lib/supabase/server";
import { deleteByIdSchema, eventSchema } from "@/lib/validation/access";

function toIso(local: string) {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d.toISOString();
}

export async function saveEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff("/admin/events");
  if (!canManageEvents(user.role)) return { ok: false, message: "Events role required." };

  const parsed = eventSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const season = await getActiveSeason();
  if (!season) return { ok: false, message: "No active season." };

  let starts_at: string;
  try {
    starts_at = toIso(parsed.data.starts_at);
  } catch {
    return { ok: false, message: "Use a valid start time." };
  }

  const { id, ...rest } = parsed.data;
  const row = { ...rest, starts_at, season_id: season.id };
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("events").update(row).eq("id", id)
    : await supabase.from("events").insert(row);

  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_log").insert({
    season_id: season.id,
    actor_id: user.id,
    action: "event_updated",
    entity_type: "event",
    entity_id: id ?? null,
    summary: `${id ? "Updated" : "Created"} event ${parsed.data.title}`,
    after_json: row as never,
  });

  updateTag(tags.events);
  updateTag(tags.audit);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/admin");
  return { ok: true, message: "Event saved." };
}

export async function archiveEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/events");
  if (!canManageEvents(user.role)) return { ok: false, message: "Events role required." };

  const parsed = deleteByIdSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "archived" })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: error.message };

  updateTag(tags.events);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true, message: "Event archived." };
}
