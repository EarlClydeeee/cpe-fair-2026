"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canManageContent, requireStaff } from "@/lib/auth";
import { ensureActiveSeason } from "@/lib/data/season";
import { tags } from "@/lib/data/tags";
import { createClient } from "@/lib/supabase/server";
import { liveBroadcastSchema } from "@/lib/validation/access";

function revalidateLivePaths() {
  updateTag(tags.live);
  revalidateTag(tags.live, "max");
  revalidatePath("/live");
  revalidatePath("/admin/live");
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function saveLiveBroadcast(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/live");
  if (!canManageContent(user.role)) {
    return { ok: false, message: "Site admin role required." };
  }

  const parsed = liveBroadcastSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const season = await ensureActiveSeason(supabase);
  if (!season) {
    return {
      ok: false,
      message: "Could not resolve an active season.",
    };
  }

  const { title, facebook_url, is_active } = parsed.data;
  const payload = {
    season_id: season.id,
    title,
    facebook_url,
    is_active,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("live_broadcasts")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("season_id", season.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message ?? "Could not update live stream." };
    }

    revalidateLivePaths();
    return {
      ok: true,
      id: data.id,
      message: is_active ? "Live stream is on the public page." : "Live stream saved (offline).",
    };
  }

  const { data, error } = await supabase
    .from("live_broadcasts")
    .upsert(payload, { onConflict: "season_id" })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Could not save live stream." };
  }

  revalidateLivePaths();
  return {
    ok: true,
    id: data.id,
    message: is_active ? "Live stream is on the public page." : "Live stream saved (offline).",
  };
}
