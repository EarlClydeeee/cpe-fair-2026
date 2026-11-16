import Link from "next/link";
import type { Category } from "@/lib/data/public";

function tabClass(active: boolean) {
  return `rounded-lg px-4 py-2 text-xs tracking-[0.12em] uppercase transition-colors duration-200 ${
    active
      ? "bg-accent text-black"
      : "bg-surface-2 text-muted hover:text-foreground"
  }`;
}

export function CategoryTabs({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/leaderboard" className={tabClass(!activeSlug)}>
        Overall
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/leaderboard?category=${cat.slug}`}
          className={tabClass(activeSlug === cat.slug)}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
