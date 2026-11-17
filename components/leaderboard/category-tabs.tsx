import Link from "next/link";
import type { Category } from "@/lib/data/public";

function tabClass(active: boolean) {
  return `rounded-lg px-4 py-2 text-xs tracking-[0.12em] uppercase font-semibold transition-colors duration-200 ${
    active
      ? "bg-[#ff6a00] text-black shadow-[0_2px_12px_rgba(255,106,0,0.25)]"
      : "bg-[#18191c] border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
  }`;
}

export function CategoryTabs({
  categories,
  activeSlug,
  showSampleBadge = false,
}: {
  categories: Category[];
  activeSlug?: string;
  showSampleBadge?: boolean;
}) {
  // Ensure "Literacy" is always in the tab list even if the DB hasn't been seeded yet
  const hasLiteracy = categories.some((c) => c.slug === "literacy");
  const tabList = hasLiteracy
    ? categories
    : [
        ...categories,
        {
          id: "cat-7",
          season_id: "default",
          slug: "literacy",
          name: "Literacy",
          sort_order: 7,
          created_at: "",
          updated_at: "",
        },
      ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/leaderboard" className={tabClass(!activeSlug)}>
          Overall
        </Link>
        {tabList.map((cat) => (
          <Link
            key={cat.id}
            href={`/leaderboard?category=${cat.slug}`}
            className={tabClass(activeSlug === cat.slug)}
          >
            {cat.name}
          </Link>
        ))}
      </div>
      {showSampleBadge ? (
        <span className="hidden text-[10px] font-bold tracking-[0.16em] text-neutral-400 uppercase sm:inline-block">
          PREVIEW / SAMPLE SCORES
        </span>
      ) : null}
    </div>
  );
}
