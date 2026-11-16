import type { Metadata } from "next";
import { TeamManager } from "@/components/admin/team-manager";
import { getAdminTeams } from "@/lib/data/admin";
import { getStandings } from "@/lib/data/public";

export const metadata: Metadata = { title: "Team management" };

export default async function AdminTeamsPage() {
  const [teams, { rows }] = await Promise.all([getAdminTeams(), getStandings()]);
  const totals = Object.fromEntries(rows.map((r) => [r.team.id, r.total]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-5xl">Team Management</h1>
        <p className="mt-2 text-sm text-muted">
          Names, affiliations, colors, and public visibility for the season roster.
        </p>
      </div>
      <TeamManager teams={teams} totals={totals} />
    </div>
  );
}
