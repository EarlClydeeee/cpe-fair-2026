import type { Metadata } from "next";
import { CategoryTabs } from "@/components/leaderboard/category-tabs";
import { MatchSpotlight, pickSpotlight } from "@/components/leaderboard/match-spotlight";
import { Podium } from "@/components/leaderboard/podium";
import { StandingsTable } from "@/components/leaderboard/standings-table";
import { TitleRace } from "@/components/leaderboard/title-race";
import { getEvents, getStandings } from "@/lib/data/public";

export const metadata: Metadata = { title: "Leaderboard" };
export const instant = false;

type Props = { searchParams: Promise<{ category?: string }> };

export default async function LeaderboardPage({ searchParams }: Props) {
  const { category: categorySlug } = await searchParams;
  const [{ categories, rows }, events] = await Promise.all([
    getStandings(categorySlug),
    getEvents(),
  ]);

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const spotlight = pickSpotlight(events, categorySlug);

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

          {/* Active Category Floating Tag with Glowing Status Beacon */}
          <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-neutral-800/90 bg-[#16171b]/95 px-4 py-1.5 shadow-xl shadow-black/80 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ff6a00] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#ff6a00]" />
            </span>
            <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-300 uppercase sm:text-xs">
              {activeCategory
                ? `${activeCategory.name} Leaderboard`
                : "Overall Competition Leaderboard"}
            </span>
          </div>
        </div>
      </header>

      {/* Dashed Divider */}
      <div className="my-7 border-b border-dashed border-neutral-700/60" />

      {/* Category Navigation Tabs */}
      <CategoryTabs categories={categories} activeSlug={categorySlug} />

      {/* Main Content Layout */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.85fr_0.85fr]">
        <div className="space-y-8">
          {rows.length ? (
            <>
              <Podium rows={rows} />
              <StandingsTable rows={rows} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-800 bg-[#16171b] p-8 text-center">
              <p className="font-display text-2xl font-black tracking-wide text-white uppercase">
                No standings yet
              </p>
              <p className="mt-2 max-w-md mx-auto text-sm text-neutral-400">
                Scores and teams will appear as events unfold.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {spotlight ? <MatchSpotlight event={spotlight} /> : null}

          <TitleRace
            rows={rows}
            categoryName={activeCategory?.name}
            categoryCount={categories.length}
          />

          <div className="rounded-xl border border-neutral-800/90 border-l-2 border-l-[#ff6a00] bg-[#16171b] p-4 text-xs">
            <p className="font-semibold text-neutral-300">A preview of the climb.</p>
            <p className="mt-0.5 text-neutral-500">
              Scores and matchups shown are illustrative.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
