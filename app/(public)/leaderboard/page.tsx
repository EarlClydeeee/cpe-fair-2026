import type { Metadata } from "next";
import { CategoryTabs } from "@/components/leaderboard/category-tabs";
import { MatchSpotlight } from "@/components/leaderboard/match-spotlight";
import { Podium } from "@/components/leaderboard/podium";
import { StandingsTable } from "@/components/leaderboard/standings-table";
import { TitleRace } from "@/components/leaderboard/title-race";
import { getEvents, getStandings } from "@/lib/data/public";

export const metadata: Metadata = { title: "Leaderboard" };
export const instant = false;

type Props = { searchParams: Promise<{ category?: string }> };

export default async function LeaderboardPage({ searchParams }: Props) {
  const { category: categorySlug } = await searchParams;
  const [{ categories, rows, source }, events] = await Promise.all([
    getStandings(categorySlug),
    getEvents(),
  ]);

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const isSample = source === "sample";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="reveal">
          <p className="text-xs tracking-[0.2em] text-accent uppercase">
            Eight teams. One court.
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">
            {activeCategory
              ? `${activeCategory.name} Leaderboard`
              : "Overall Leaderboard"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Every point counts. Follow the teams rising to the top of ACCESS CPE Fair 2026.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Fly high</p>
          <p className="font-display text-6xl text-accent sm:text-7xl">2026</p>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">The next chapter</p>
        </div>
      </div>

      <div className="dash-rule my-8" />

      <CategoryTabs
        categories={categories}
        activeSlug={categorySlug}
        showSampleBadge={isSample}
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
                Add teams and publish scores for the active season to fill the podium and table.
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
              A preview of the climb. Scores and matchups shown are illustrative until live scoring
              begins.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
