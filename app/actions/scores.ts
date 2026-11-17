"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canScore, requireStaff } from "@/lib/auth";
import { tags } from "@/lib/data/tags";
import { createClient } from "@/lib/supabase/server";
import {
  discardDraftSchema,
  publishDraftsSchema,
  scoreDraftSchema,
} from "@/lib/validation/access";

export async function saveScoreDraft(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/leaderboards");
  if (!canScore(user.role)) return { ok: false, message: "Scoring role required." };

  const parsed = scoreDraftSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_score_draft", {
    p_team_id: parsed.data.team_id,
    p_category_id: parsed.data.category_id,
    p_draft_points: parsed.data.draft_points,
    p_reason: parsed.data.reason,
  });

  if (error) return { ok: false, message: error.message };

  updateTag(tags.drafts);
  updateTag(tags.audit);
  revalidatePath("/admin");
  revalidatePath("/admin/leaderboards");
  revalidatePath("/admin/leaderboards/review");
  return { ok: true, message: "Draft saved." };
}

export async function discardDraft(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/leaderboards");
  if (!canScore(user.role)) return { ok: false, message: "Scoring role required." };

  const parsed = discardDraftSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("score_drafts").delete().eq("id", parsed.data.draft_id);
  if (error) return { ok: false, message: error.message };

  updateTag(tags.drafts);
  revalidatePath("/admin/leaderboards");
  revalidatePath("/admin/leaderboards/review");
  return { ok: true, message: "Draft discarded." };
}

/** Atomic publish of reviewed score drafts (locks rows inside publish_score_drafts). */
export async function publishPendingScoreDrafts(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/leaderboards/review");
  if (!canScore(user.role)) return { ok: false, message: "Scoring role required." };

  const parsed = publishDraftsSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_score_drafts", {
    p_draft_ids: parsed.data.draft_ids,
  });

  if (error) return { ok: false, message: error.message };

  updateTag(tags.scores);
  updateTag(tags.drafts);
  updateTag(tags.audit);
  revalidatePath("/admin");
  revalidatePath("/admin/leaderboards");
  revalidatePath("/admin/leaderboards/review");
  revalidatePath("/admin/leaderboards/history");
  revalidatePath("/leaderboard");
  revalidatePath("/teams");
  return { ok: true, message: `Published ${data ?? 0} update(s).` };
}

/** Form entrypoint — alias of publishPendingScoreDrafts. */
export async function publishDrafts(
  prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return publishPendingScoreDrafts(prev, formData);
}
