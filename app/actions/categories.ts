"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canManageContent, requireStaff } from "@/lib/auth";
import { ensureActiveSeason } from "@/lib/data/season";
import { tags } from "@/lib/data/tags";
import { createClient } from "@/lib/supabase/server";
import {
  archiveByIdSchema,
  categorySchema,
  competitionSchema,
} from "@/lib/validation/access";

function revalidateCategoryPaths() {
  updateTag(tags.season);
  updateTag(tags.scores);
  updateTag(tags.events);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/leaderboards");
  revalidatePath("/admin/events");
  revalidatePath("/leaderboard");
  revalidatePath("/events");
}

export async function saveCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/categories");
  if (!canManageContent(user.role)) {
    return { ok: false, message: "Content role required." };
  }

  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const season = await ensureActiveSeason(supabase);
  if (!season) {
    return { ok: false, message: "Could not resolve an active season." };
  }

  const { id, ...rest } = parsed.data;
  const row = { ...rest, season_id: season.id, is_archived: false };

  if (id) {
    const { error } = await supabase.from("categories").update(row).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("categories").insert(row);
    if (error) return { ok: false, message: error.message };
  }

  revalidateCategoryPaths();
  return { ok: true, message: id ? "Category saved." : "Category created." };
}

export async function archiveCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/categories");
  if (!canManageContent(user.role)) {
    return { ok: false, message: "Content role required." };
  }

  const parsed = archiveByIdSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_archived: true })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: error.message };

  await supabase
    .from("competitions")
    .update({ is_archived: true })
    .eq("category_id", parsed.data.id);

  revalidateCategoryPaths();
  return { ok: true, message: "Category archived." };
}

export async function saveCompetition(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/categories");
  if (!canManageContent(user.role)) {
    return { ok: false, message: "Content role required." };
  }

  const parsed = competitionSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const season = await ensureActiveSeason(supabase);
  if (!season) {
    return { ok: false, message: "Could not resolve an active season." };
  }

  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id, season_id")
    .eq("id", parsed.data.category_id)
    .eq("season_id", season.id)
    .maybeSingle();
  if (catError) return { ok: false, message: catError.message };
  if (!category) return { ok: false, message: "Category not found." };

  const { id, category_id, name, slug, sort_order } = parsed.data;
  const row = {
    category_id,
    name,
    slug,
    sort_order,
    season_id: season.id,
    is_archived: false,
  };

  if (id) {
    const { error } = await supabase.from("competitions").update(row).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("competitions").insert(row);
    if (error) return { ok: false, message: error.message };
  }

  revalidateCategoryPaths();
  return { ok: true, message: id ? "Competition saved." : "Competition created." };
}

export async function archiveCompetition(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/categories");
  if (!canManageContent(user.role)) {
    return { ok: false, message: "Content role required." };
  }

  const parsed = archiveByIdSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("competitions")
    .update({ is_archived: true })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, message: error.message };

  revalidateCategoryPaths();
  return { ok: true, message: "Competition archived." };
}
