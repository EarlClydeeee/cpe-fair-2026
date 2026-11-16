import "server-only";
import { updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";
import { tags } from "./tags";

export type Season = Tables<"seasons">;

const DEFAULT_SEASON = {
  slug: "cpe-fair-2026",
  name: "CPE Fair 2026",
  year: 2026,
  is_active: true,
} as const;

/** Live (uncached) season lookup for admin mutations. Creates the default season if missing. */
export async function ensureActiveSeason(
  supabase: SupabaseClient<Database>,
): Promise<Season | null> {
  const { data: active, error: activeError } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) {
    console.error("[data] ensureActiveSeason:", activeError.message);
    return null;
  }
  if (active) return active;

  const { data: created, error: createError } = await supabase
    .from("seasons")
    .insert(DEFAULT_SEASON)
    .select("*")
    .single();

  if (!createError && created) {
    updateTag(tags.season);
    return created;
  }

  const { data: existing } = await supabase
    .from("seasons")
    .select("*")
    .eq("slug", DEFAULT_SEASON.slug)
    .maybeSingle();

  if (!existing) {
    console.error("[data] ensureActiveSeason create:", createError?.message);
    return null;
  }

  if (!existing.is_active) {
    const { data: activated, error: activateError } = await supabase
      .from("seasons")
      .update({ is_active: true })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (activateError) {
      console.error("[data] ensureActiveSeason activate:", activateError.message);
      return existing;
    }
    updateTag(tags.season);
    return activated;
  }

  updateTag(tags.season);
  return existing;
}
