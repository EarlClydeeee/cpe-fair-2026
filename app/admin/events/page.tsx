import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { EventManager } from "@/components/admin/event-manager";
import { getAdminEvents } from "@/lib/data/admin";
import { getCategories, getCompetitions, getTeams } from "@/lib/data/public";

export const metadata: Metadata = { title: "Event management" };
export const instant = false;

type Props = { searchParams: Promise<{ status?: string; id?: string }> };

async function EventsContent({ searchParams }: Props) {
  await connection();
  const [{ status, id }, events, categories, competitions, teams] =
    await Promise.all([
      searchParams,
      getAdminEvents(),
      getCategories(),
      getCompetitions(),
      getTeams(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl leading-none sm:text-5xl">
          Event Management
        </h1>
        <p className="mt-2 text-sm text-muted">
          Organize fixtures, update venues, and keep the public schedule in sync.
        </p>
      </div>
      <EventManager
        events={events}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        competitions={competitions.map((c) => ({
          id: c.id,
          name: c.name,
          category_id: c.category_id,
        }))}
        teams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          color_hex: t.color_hex,
        }))}
        initialStatusFilter={status}
        initialSelectedId={id}
      />
    </div>
  );
}

export default function AdminEventsPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          Loading events…
        </div>
      }
    >
      <EventsContent {...props} />
    </Suspense>
  );
}