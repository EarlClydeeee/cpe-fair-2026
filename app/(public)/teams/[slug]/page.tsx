import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/placeholder";
import { getStandings, getTeamBySlug } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return { title: team?.name ?? "Team" };
}

export default async function TeamDetailPage({ params }: Props) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  const { categories, rows } = await getStandings();
  const standing = rows.find((r) => r.team.id === team.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/teams"
        className="text-sm text-muted transition-colors duration-200 hover:text-accent"
      >
        ← Back to teams
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Placeholder
          label={team.name}
          ratio="1/1"
          color={team.color_hex}
          className="rounded-xl"
        />
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">{team.affiliation}</p>
          <h1 className="mt-2 font-display text-5xl" style={{ color: team.color_hex }}>
            {team.name}
          </h1>
          <p className="mt-4 font-display text-5xl">{formatPoints(standing?.total ?? 0)} PTS</p>
          <p className="mt-1 text-sm text-muted">
            Overall rank #{String(standing?.rank ?? "—").padStart(2, "0")}
          </p>

          <div className="dash-rule my-8" />

          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Category breakdown</p>
          <div className="mt-4 space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm">{cat.name}</span>
                <span className="font-display text-2xl">
                  {formatPoints(standing?.byCategory[cat.slug] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
