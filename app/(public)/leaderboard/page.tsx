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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Centered Hero Title (Dynamic Animated 3D Typography - No Pixelation) */}
      <header className="relative mx-auto flex flex-col items-center justify-center pt-3 pb-5 text-center select-none overflow-visible">
        {/* Ambient Stadium Court Atmosphere - Breathing Aura */}
        <div
          className="pointer-events-none absolute -top-16 h-72 w-[600px] max-w-full rounded-full bg-gradient-to-b from-[#ff6a00]/20 via-[#ff6a00]/10 to-transparent blur-3xl animate-court-pulse"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-4 h-40 w-80 rounded-full bg-[#ff6a00]/20 blur-2xl animate-glow-drift"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Top Kicker with Framed Court Accent Lines */}
          <div className="flex items-center gap-3 sm:gap-4">
            <span
              className="h-[1.5px] w-6 sm:w-14 bg-gradient-to-r from-transparent to-[#ff6a00]"
              aria-hidden
            />
            <p className="font-display text-xs font-bold tracking-[0.3em] text-[#ff6a00] uppercase sm:text-sm md:text-base drop-shadow-[0_2px_12px_rgba(255,106,0,0.5)]">
              SERVE, SET, ENGINEER
            </p>
            <span
              className="h-[1.5px] w-6 sm:w-14 bg-gradient-to-l from-transparent to-[#ff6a00]"
              aria-hidden
            />
          </div>

          {/* Main Title: ON THE COURT with Metallic Shimmer */}
          <h1 className="mt-2.5 font-display text-5xl font-black tracking-tight uppercase sm:text-6xl md:text-7xl lg:text-8xl leading-none">
            <span className="bg-[linear-gradient(110deg,#ffffff_25%,#ffedd5_45%,#ffffff_60%,#e2e8f0_75%,#ffffff_100%)] bg-clip-text text-transparent animate-shimmer drop-shadow-[0_4px_24px_rgba(255,106,0,0.35)] [paint-order:stroke_fill]">
              ON THE COURT
            </span>
          </h1>

          {/* Tournament Year: 2026 with Buttery Smooth Metallic Sheen & Breathing Glow */}
          <p className="mt-1 font-display text-6xl font-black tracking-tight sm:text-7xl md:text-8xl lg:text-9xl leading-none animate-year-glow">
            <span className="bg-[linear-gradient(115deg,#ff6a00_0%,#ff8838_30%,#ffe2b8_50%,#ff8838_70%,#ff6a00_100%)] bg-clip-text text-transparent animate-year-sheen">
              2026
            </span>
          </p>
        </div>
      </header>

      {/* Dashed Divider */}
      <div className="my-7 border-b border-dashed border-neutral-700/60" />

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
