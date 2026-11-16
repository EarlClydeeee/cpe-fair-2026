"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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

const NEW_TEAM = "new" as const;

function nextSortOrder(teams: TeamRow[]) {
  if (!teams.length) return 1;
  return Math.max(...teams.map((t) => t.sort_order)) + 1;
}

export function TeamManager({
  teams,
  totals,
}: {
  teams: TeamRow[];
  totals: Record<string, number>;
}) {
  const [selectedId, setSelectedId] = useState<string>(teams[0]?.id ?? NEW_TEAM);
  const [query, setQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isCreating = selectedId === NEW_TEAM;
  const selected = useMemo(
    () => (isCreating ? undefined : teams.find((t) => t.id === selectedId)),
    [teams, selectedId, isCreating],
  );
  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  const [saveState, saveAction] = useActionState(saveTeam, initialActionState);
  const [archiveState, archiveAction] = useActionState(archiveTeam, initialActionState);
  const formKey = selected?.id ?? NEW_TEAM;
  const previewName = selected?.name ?? "New team";
  const previewColor = selected?.color_hex ?? "#FF6B21";
  const previewArtwork = previewUrl ?? selected?.artwork_url ?? null;

  useEffect(() => {
    setPreviewUrl(null);
  }, [formKey]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team..."
            className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setSelectedId(NEW_TEAM)}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              isCreating
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface-2 text-foreground hover:bg-surface"
            }`}
          >
            Add team
          </button>
        </div>
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
          {!filtered.length ? (
            <p className="px-4 py-6 text-sm text-muted">
              {teams.length ? "No teams match that search." : "No teams yet. Add the first one."}
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted">
          {teams.filter((t) => t.visibility === "active").length} active teams ·{" "}
          {teams.filter((t) => t.visibility === "archived").length} archived. Archiving preserves
          score history.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl">{isCreating ? "Add team" : "Edit team"}</h2>
        <p className="text-xs text-muted">
          {isCreating
            ? "Create a new roster entry for the active season."
            : `${selected?.name ?? "Team"} · ${selected?.affiliation || "No affiliation"}`}
        </p>
        <TeamBanner
          name={previewName}
          colorHex={previewColor}
          artworkUrl={previewArtwork}
          ratio="16/9"
          className="mt-4 rounded-xl"
        />
        <form key={formKey} action={saveAction} className="mt-4 space-y-3">
          {selected ? <input type="hidden" name="id" value={selected.id} /> : null}
          <input type="hidden" name="artwork_url" value={selected?.artwork_url ?? ""} />
          <TextField label="Team name" name="name" defaultValue={selected?.name} required />
          <TextField
            label="Slug"
            name="slug"
            defaultValue={selected?.slug}
            placeholder="lowercase-hyphen-slug"
            required
          />
          <TextField
            label="Affiliation"
            name="affiliation"
            defaultValue={selected?.affiliation ?? ""}
          />
          <TextField
            label="Team color"
            name="color_hex"
            defaultValue={selected?.color_hex ?? "#FF6B21"}
          />
          <label className="block space-y-1.5">
            <span className="text-xs font-medium tracking-wide text-muted uppercase">
              Team artwork
            </span>
            <input
              type="file"
              name="artwork"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
            />
            <span className="block text-xs text-muted">
              JPEG, PNG, WebP, or GIF up to 5MB. Leave empty to keep the current image.
            </span>
          </label>
          <SelectField
            label="Public visibility"
            name="visibility"
            defaultValue={selected?.visibility ?? "active"}
          >
            <option value="active">Active / visible</option>
            <option value="archived">Archived</option>
          </SelectField>
          <TextField
            label="Sort order"
            name="sort_order"
            type="number"
            defaultValue={selected?.sort_order ?? nextSortOrder(teams)}
          />
          {!isCreating ? (
            <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
              Current overall points:{" "}
              <span className="font-display text-xl">{totals[selected?.id ?? ""] ?? 0}</span>
            </div>
          ) : null}
          <FormMessage state={saveState} />
          <SubmitButton className="w-full">
            {isCreating ? "Create team" : "Save team"}
          </SubmitButton>
        </form>
        {selected ? (
          <form action={archiveAction} className="mt-3">
            <input type="hidden" name="id" value={selected.id} />
            <FormMessage state={archiveState} />
            <SubmitButton variant="ghost" className="w-full">
              Archive team
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}
