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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="relative mx-auto flex flex-col items-center overflow-visible pt-1 pb-3 text-center select-none sm:pt-3 sm:pb-5">
        <div
          className="pointer-events-none absolute -top-10 h-48 w-[min(100%,28rem)] rounded-full bg-gradient-to-b from-[#ff6a00]/20 via-[#ff6a00]/10 to-transparent blur-3xl sm:-top-16 sm:h-72 sm:w-[600px] animate-court-pulse"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-2 h-28 w-56 rounded-full bg-[#ff6a00]/20 blur-2xl sm:top-4 sm:h-40 sm:w-80 animate-glow-drift"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <span
              className="h-[1.5px] w-5 bg-gradient-to-r from-transparent to-[#ff6a00] sm:w-14"
              aria-hidden
            />
            <p className="font-display text-[10px] font-bold tracking-[0.28em] text-[#ff6a00] uppercase sm:text-sm md:text-base drop-shadow-[0_2px_12px_rgba(255,106,0,0.5)]">
              {activeCategory ? activeCategory.name : "Serve, set, engineer"}
            </p>
            <span
              className="h-[1.5px] w-5 bg-gradient-to-l from-transparent to-[#ff6a00] sm:w-14"
              aria-hidden
            />
          </div>

          <h1 className="mt-2 font-display text-[2.35rem] font-black tracking-tight uppercase leading-[0.92] sm:mt-2.5 sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="bg-[linear-gradient(110deg,#ffffff_25%,#ffedd5_45%,#ffffff_60%,#e2e8f0_75%,#ffffff_100%)] bg-clip-text text-transparent animate-shimmer drop-shadow-[0_4px_24px_rgba(255,106,0,0.35)]">
              On the court
            </span>
          </h1>

          <p className="mt-0.5 font-display text-[2.75rem] font-black tracking-tight leading-none sm:mt-1 sm:text-7xl md:text-8xl lg:text-9xl animate-year-glow">
            <span className="bg-[linear-gradient(115deg,#ff6a00_0%,#ff8838_30%,#ffe2b8_50%,#ff8838_70%,#ff6a00_100%)] bg-clip-text text-transparent animate-year-sheen">
              2026
            </span>
          </p>
        </div>
      </header>

      <div className="my-5 border-b border-dashed border-neutral-700/60 sm:my-7" />

      <CategoryTabs
        categories={categories}
        activeSlug={categorySlug}
        showSampleBadge={isSample}
      />

      {/* Phone: spotlight before the climb */}
      <div className="mt-6 lg:hidden">
        <MatchSpotlight events={events} categorySlug={categorySlug} />
      </div>

      <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1.7fr_0.9fr] lg:gap-4">
        <div className="space-y-7 sm:space-y-8">
          {rows.length ? (
            <>
              <Podium rows={rows} />
              <StandingsTable
                rows={rows}
                categoryName={activeCategory?.name}
                countsTowardOverall={activeCategory?.include_in_scoring ?? true}
              />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface p-6 sm:p-8">
              <p className="font-display text-2xl tracking-wide uppercase">No standings yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                Add teams and publish scores for the active season to fill the podium and table.
              </p>
            </div>
          )}
        </div>

        <aside className="hidden space-y-4 lg:block">
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

      <div className="mt-6 space-y-4 lg:hidden">
        <TitleRace
          rows={rows}
          categoryName={activeCategory?.name}
          categoryCount={categories.length}
        />
        {isSample ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-xs leading-5 text-muted">
            Sample scores until published results go live.
          </div>
        ) : null}
      </div>
    </div>
  );
}
