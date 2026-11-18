import Link from "next/link";
import type { Category } from "@/lib/data/public";

function tabClass(active: boolean) {
  return `whitespace-nowrap rounded-lg px-3.5 py-2.5 text-[11px] tracking-[0.12em] uppercase font-semibold transition-colors duration-200 sm:px-4 sm:text-xs ${
    active
      ? "bg-[#ff6a00] text-black shadow-[0_2px_12px_rgba(255,106,0,0.25)]"
      : "bg-[#18191c] border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
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
    <div className="space-y-2">
      <div className="-mx-4 scroll-rail-edge px-4 sm:mx-0 sm:px-0">
        <div className="scroll-rail flex-nowrap" role="tablist" aria-label="Categories">
          <Link href={basePath} className={tabClass(!activeSlug)}>
            Overall
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`${basePath}?category=${cat.slug}`}
              className={tabClass(activeSlug === cat.slug)}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
      {showSampleBadge ? (
        <p className="text-[10px] font-bold tracking-[0.16em] text-neutral-500 uppercase">
          Preview / sample scores
        </p>
      ) : null}
    </div>
  );
}
