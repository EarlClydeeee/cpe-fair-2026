import type { Metadata } from "next";
import { CategoryTabs } from "@/components/leaderboard/category-tabs";
import { MatchSpotlight } from "@/components/leaderboard/match-spotlight";
import { Podium } from "@/components/leaderboard/podium";
import { StandingsTable } from "@/components/leaderboard/standings-table";
import { TitleRace } from "@/components/leaderboard/title-race";
import { LiveRefresh } from "@/components/live/live-refresh";
import { getEvents, getStandings } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Live board",
  description: "Auto-updating ACCESS CPE Fair 2026 standings and match spotlight.",
};
export const instant = false;

type Props = { searchParams: Promise<{ category?: string }> };

export default async function LivePage({ searchParams }: Props) {
  const { category: categorySlug } = await searchParams;
  const [{ categories, rows, source }, events] = await Promise.all([
    getStandings(categorySlug),
    getEvents(),
  ]);

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const isSample = source === "sample";
  const leader = rows[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="reveal space-y-4">
          <LiveRefresh />
          <div>
            <p className="text-xs tracking-[0.2em] text-accent uppercase">
              ACCESS CPE Fair 2026
            </p>
            <h1 className="mt-2 font-display text-5xl sm:text-6xl">
              {activeCategory ? `${activeCategory.name} Live` : "Live Board"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Stadium display — standings and spotlight refresh automatically as scores are
              published.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-right">
          <p className="text-[10px] tracking-[0.18em] text-muted uppercase">Current leader</p>
          <p className="mt-1 font-display text-3xl text-accent sm:text-4xl">
            {leader?.team.name ?? "—"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {leader ? `${leader.total.toLocaleString("en-US")} pts` : "Waiting for scores"}
          </p>
        </div>
      </div>

      <div className="dash-rule my-8" />

      <CategoryTabs
        categories={categories}
        activeSlug={categorySlug}
        showSampleBadge={isSample}
        basePath="/live"
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-8">
          {rows.length ? (
            <>
              <Podium rows={rows} />
              <StandingsTable rows={rows} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface p-8">
              <p className="font-display text-2xl tracking-wide uppercase">No standings yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                Publish scores from the control room to fill this live board.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <MatchSpotlight events={events} categorySlug={categorySlug} />
          <TitleRace
            rows={rows}
            categoryName={activeCategory?.name}
            categoryCount={categories.length}
          />
          {isSample ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-xs leading-5 text-muted">
              Showing sample standings until published scores are available.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-2 p-4 text-xs leading-5 text-muted">
              Public board updates when admins publish drafts. This page also polls every 10
              seconds so displays stay current without a manual reload.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
