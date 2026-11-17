import "server-only";
import { requireStaff } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason, getCategories, getStandings, getTeams } from "./public";

export type DraftDiff = {
  draft: Tables<"score_drafts">;
  team: Tables<"competition_teams">;
  category: Tables<"categories">;
  publishedPoints: number;
  delta: number;
};

export async function getScoreMatrix() {
  const user = await requireStaff("/admin/leaderboards");

  const season = await getActiveSeason();
  const [{ categories, rows }, drafts] = await Promise.all([
    getStandings(),
    getDrafts(),
  ]);

  const draftMap = new Map(
    drafts.map((d) => [`${d.team_id}:${d.category_id}` as `${string}:${string}`, d]),
  );

  return { season, categories, rows, drafts, draftMap, user };
}

export async function getDrafts(): Promise<Tables<"score_drafts">[]> {
  await requireStaff();
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_drafts")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDraftDiffs(): Promise<DraftDiff[]> {
  const [drafts, teams, categories, { rows }] = await Promise.all([
    getDrafts(),
    getTeams(),
    getCategories(),
    getStandings(),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const publishedByKey = new Map<string, number>();
  for (const row of rows) {
    for (const cat of categories) {
      publishedByKey.set(`${row.team.id}:${cat.id}`, row.byCategory[cat.slug] ?? 0);
    }
  }

  return drafts.flatMap((draft) => {
    const team = teamById.get(draft.team_id);
    const category = catById.get(draft.category_id);
    if (!team || !category) return [];
    const publishedPoints = publishedByKey.get(`${draft.team_id}:${draft.category_id}`) ?? 0;
    return [
      {
        draft,
        team,
        category,
        publishedPoints,
        delta: draft.draft_points - publishedPoints,
      },
    ];
  });
}

export async function getProjectedStandings(diffs: DraftDiff[]) {
  const { rows, categories } = await getStandings();
  const override = new Map(diffs.map((d) => [`${d.team.id}:${d.category.slug}`, d.draft.draft_points]));

  const projected = rows.map((row) => {
    const byCategory = { ...row.byCategory };
    for (const cat of categories) {
      const key = `${row.team.id}:${cat.slug}`;
      if (override.has(key)) byCategory[cat.slug] = override.get(key)!;
    }
    const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
    return { ...row, byCategory, total, projectedTotal: total };
  });

  projected.sort((a, b) => b.total - a.total || a.team.sort_order - b.team.sort_order);
  const leader = projected[0]?.total ?? 0;
  projected.forEach((row, i) => {
    row.rank = i + 1;
    row.toLeader = row.total - leader;
  });

  return projected;
}
