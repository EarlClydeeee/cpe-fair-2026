import Link from "next/link";
import type { Category } from "@/lib/data/public";

function tabClass(active: boolean) {
  return `inline-flex items-center justify-center rounded-full px-4 py-2 text-center font-sans text-xs font-bold tracking-[0.14em] uppercase whitespace-nowrap transition-all duration-200 select-none sm:px-5 sm:py-2.5 sm:text-[13px] ${
    active
      ? "bg-[#ff6a00] text-black shadow-[0_2px_14px_rgba(255,106,0,0.3)] ring-1 ring-[#ff6a00]"
      : "bg-[#18191c] border border-neutral-800/90 text-neutral-300 hover:border-neutral-700 hover:bg-[#202227] hover:text-white"
  }`;
}

export function CategoryTabs({
  categories,
  activeSlug,
  showSampleBadge = false,
  basePath = "/leaderboard",
}: {
  categories: Category[];
  activeSlug?: string;
  showSampleBadge?: boolean;
  basePath?: string;
}) {
  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
        role="tablist"
        aria-label="Categories"
      >
        <Link href={basePath} className={tabClass(!activeSlug)}>
          Overall
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`${basePath}?category=${cat.slug}`}
            className={tabClass(activeSlug === cat.slug)}
            title={
              cat.include_in_scoring
                ? undefined
                : "Ranked in this filter only — not counted in Overall"
            }
          >
            {cat.name}
            {!cat.include_in_scoring ? (
              <span className="ml-1.5 text-[9px] font-semibold tracking-wide opacity-70">
                · filter
              </span>
            ) : null}
          </Link>
        ))}
      </div>
      {showSampleBadge ? (
        <p className="text-center text-[10px] font-bold tracking-[0.16em] text-neutral-500 uppercase">
          Preview / sample scores
        </p>
      ) : null}
    </div>
  );
}
