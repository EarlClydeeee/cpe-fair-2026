import type { Metadata } from "next";
import { EventManager } from "@/components/admin/event-manager";
import { getAdminEvents } from "@/lib/data/admin";
import { getCategories, getTeams } from "@/lib/data/public";

export const metadata: Metadata = { title: "Event management" };

type Props = { searchParams: Promise<{ status?: string; id?: string }> };

export default async function AdminEventsPage({ searchParams }: Props) {
  const { status, id } = (await searchParams) ?? {};
  const [events, categories, teams] = await Promise.all([
    getAdminEvents(),
    getCategories(),
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
        teams={teams.map((t) => ({ id: t.id, name: t.name, color_hex: t.color_hex }))}
        initialStatusFilter={status}
        initialSelectedId={id}
      />
    </div>
  );
}
