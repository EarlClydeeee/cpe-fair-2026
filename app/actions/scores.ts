"use server";

import { revalidatePath, updateTag } from "next/cache";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { canScore, requireStaff } from "@/lib/auth";
import { tags } from "@/lib/data/tags";
import { hasServiceRole } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/server";
import {
  discardDraftSchema,
  publishDraftsSchema,
  scoreDraftSchema,
} from "@/lib/validation/access";

function scoringClient() {
  if (!hasServiceRole) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it in .env.local and Vercel env vars.",
    );
  }
  return createServiceClient();
}

export async function saveScoreDraft(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff("/admin/leaderboards");
  if (!canScore(user.role)) return { ok: false, message: "Scoring role required." };

  const parsed = scoreDraftSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  try {
    const supabase = scoringClient();
    const { error } = await supabase.rpc("save_score_draft", {
      p_team_id: parsed.data.team_id,
      p_competition_id: parsed.data.competition_id,
      p_draft_points: parsed.data.draft_points,
      p_reason: parsed.data.reason,
    });

    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not save draft.",
    };
  }

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

  try {
    const supabase = scoringClient();
    const { error } = await supabase
      .from("score_drafts")
      .delete()
      .eq("id", parsed.data.draft_id);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not discard draft.",
    };
  }

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

  let data: number | null = null;
  try {
    const supabase = scoringClient();
    const result = await supabase.rpc("publish_score_drafts", {
      p_draft_ids: parsed.data.draft_ids,
    });
    if (result.error) return { ok: false, message: result.error.message };
    data = result.data;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not publish drafts.",
    };
  }

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
