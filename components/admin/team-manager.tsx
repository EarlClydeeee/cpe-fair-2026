"use client";

import { useActionState, useMemo, useState } from "react";
import { archiveTeam, saveTeam } from "@/app/actions/teams";
import { initialActionState } from "@/lib/action-state";
import { TeamBanner } from "../team-banner";
import { FormMessage } from "../ui/form-message";
import { SelectField, TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  affiliation: string;
  color_hex: string;
  visibility: string;
  sort_order: number;
  artwork_url: string | null;
};

export function TeamManager({
  teams,
  totals,
}: {
  teams: TeamRow[];
  totals: Record<string, number>;
}) {
  const [selectedId, setSelectedId] = useState(teams[0]?.id);
  const [query, setQuery] = useState("");
  const selected = useMemo(
    () => teams.find((t) => t.id === selectedId) ?? teams[0],
    [teams, selectedId],
  );
  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  const [saveState, saveAction] = useActionState(saveTeam, initialActionState);
  const [archiveState, archiveAction] = useActionState(archiveTeam, initialActionState);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team..."
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
        />
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[1.4fr_1fr_90px_90px] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
            <span>Team</span>
            <span>Affiliation</span>
            <span>Points</span>
            <span>Visibility</span>
          </div>
          {filtered.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedId(team.id)}
              className={`grid w-full grid-cols-[1.4fr_1fr_90px_90px] items-center gap-2 border-b border-border/60 px-4 py-3 text-left text-sm ${
                selected?.id === team.id ? "bg-accent-soft" : "hover:bg-surface-2"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="h-6 w-1 rounded-full" style={{ background: team.color_hex }} />
                {team.name}
              </span>
              <span className="text-muted">{team.affiliation}</span>
              <span>{totals[team.id] ?? 0}</span>
              <span className="text-success uppercase">{team.visibility}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          {teams.filter((t) => t.visibility === "active").length} active teams ·{" "}
          {teams.filter((t) => t.visibility === "archived").length} archived. Archiving preserves
          score history.
        </p>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-2xl">Edit team</h2>
          <p className="text-xs text-muted">
            {selected.name} · {selected.affiliation}
          </p>
          <TeamBanner
            name={selected.name}
            colorHex={selected.color_hex}
            artworkUrl={selected.artwork_url}
            ratio="16/9"
            className="mt-4 rounded-xl"
          />
          <form action={saveAction} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={selected.id} />
            <TextField label="Team name" name="name" defaultValue={selected.name} required />
            <TextField label="Slug" name="slug" defaultValue={selected.slug} required />
            <TextField
              label="Affiliation"
              name="affiliation"
              defaultValue={selected.affiliation}
            />
            <TextField label="Team color" name="color_hex" defaultValue={selected.color_hex} />
            <TextField
              label="Artwork URL"
              name="artwork_url"
              defaultValue={selected.artwork_url ?? ""}
              placeholder="https://…"
            />
            <SelectField label="Public visibility" name="visibility" defaultValue={selected.visibility}>
              <option value="active">Active / visible</option>
              <option value="archived">Archived</option>
            </SelectField>
            <TextField
              label="Sort order"
              name="sort_order"
              type="number"
              defaultValue={selected.sort_order}
            />
            <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
              Current overall points:{" "}
              <span className="font-display text-xl">{totals[selected.id] ?? 0}</span>
            </div>
            <FormMessage state={saveState} />
            <SubmitButton className="w-full">Save team</SubmitButton>
          </form>
          <form action={archiveAction} className="mt-3">
            <input type="hidden" name="id" value={selected.id} />
            <FormMessage state={archiveState} />
            <SubmitButton variant="ghost" className="w-full">
              Archive team
            </SubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
