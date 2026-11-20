"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  archiveTeam,
  deleteTeamPermanently,
  saveTeam,
} from "@/app/actions/teams";
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

const PRESET_COLORS = [
  { name: "Teal", hex: "#14B8A6" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Red", hex: "#E11D48" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Green", hex: "#84CC16" },
  { name: "Orange", hex: "#FF6B21" },
  { name: "Slate", hex: "#94A3B8" },
];

function nextSortOrder(teams: TeamRow[]) {
  if (!teams.length) return 1;
  return Math.max(...teams.map((t) => t.sort_order)) + 1;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function matchesQuery(team: TeamRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    team.name.toLowerCase().includes(q) ||
    team.affiliation.toLowerCase().includes(q)
  );
}

export function TeamManager({
  teams,
  totals,
}: {
  teams: TeamRow[];
  totals: Record<string, number>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(teams[0]?.id ?? NEW_TEAM);
  const [query, setQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [focus, setFocus] = useState<"list" | "editor">("list");

  const isCreating = selectedId === NEW_TEAM;
  const selected = useMemo(
    () => (isCreating ? undefined : teams.find((t) => t.id === selectedId)),
    [teams, selectedId, isCreating],
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [affiliation, setAffiliation] = useState("");
  const [colorHex, setColorHex] = useState("#FF6B21");
  const [visibility, setVisibility] = useState("active");
  const [sortOrder, setSortOrder] = useState<number>(1);

  useEffect(() => {
    if (selected) {
      setName(selected.name);
      setSlug(selected.slug);
      setSlugTouched(true);
      setAffiliation(selected.affiliation || "");
      setColorHex(selected.color_hex || "#FF6B21");
      setVisibility(selected.visibility || "active");
      setSortOrder(selected.sort_order);
    } else {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setAffiliation("");
      setColorHex("#FF6B21");
      setVisibility("active");
      setSortOrder(nextSortOrder(teams));
    }
    setPreviewUrl(null);
  }, [selectedId, selected, teams]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const [saveState, saveAction] = useActionState(saveTeam, initialActionState);
  const [archiveState, archiveAction] = useActionState(
    archiveTeam,
    initialActionState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteTeamPermanently,
    initialActionState,
  );

  useEffect(() => {
    if (saveState.ok || archiveState.ok || deleteState.ok) {
      if (deleteState.ok) {
        setSelectedId(NEW_TEAM);
        setFocus("list");
      }
      router.refresh();
    }
  }, [
    saveState.ok,
    saveState.message,
    archiveState.ok,
    archiveState.message,
    deleteState.ok,
    deleteState.message,
    router,
  ]);

  const activeTeams = useMemo(
    () =>
      teams.filter(
        (t) => t.visibility === "active" && matchesQuery(t, query),
      ),
    [teams, query],
  );
  const archivedTeams = useMemo(
    () =>
      teams.filter(
        (t) => t.visibility === "archived" && matchesQuery(t, query),
      ),
    [teams, query],
  );

  const previewName =
    name.trim() || (isCreating ? "New team" : (selected?.name ?? "Team"));
  const previewColor = colorHex || "#FF6B21";
  const previewArtwork = previewUrl ?? selected?.artwork_url ?? null;
  const isArchivedSelected = selected?.visibility === "archived";

  function openTeam(id: string) {
    setSelectedId(id);
    setFocus("editor");
  }

  function confirmPermanentDelete(teamName: string) {
    return window.confirm(
      `Permanently delete "${teamName}"?\n\nThis removes the team from the database. Scores for this team are deleted. Event matchups keep the fixture but clear this team reference. This cannot be undone.`,
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className={`space-y-4 ${focus === "editor" ? "hidden xl:block" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team or affiliation..."
            className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted/60"
          />
          <button
            type="button"
            onClick={() => openTeam(NEW_TEAM)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              isCreating
                ? "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface-2 text-foreground hover:bg-surface"
            }`}
          >
            + Add team
          </button>
        </div>

        <section className="space-y-2">
          <div className="flex items-end justify-between gap-2 px-0.5">
            <div>
              <h2 className="font-display text-xl tracking-wide uppercase">
                Active teams
              </h2>
              <p className="text-xs text-muted">
                Visible on the public roster and standings.
              </p>
            </div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {activeTeams.length} teams
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="grid grid-cols-[1.4fr_1fr_90px] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
              <span>Team</span>
              <span>Affiliation</span>
              <span>Points</span>
            </div>
            {activeTeams.map((team) => {
              const isSelected = selected?.id === team.id;
              const displayName = isSelected ? previewName : team.name;
              const displayColor = isSelected ? previewColor : team.color_hex;
              const displayAffiliation = isSelected
                ? affiliation || "—"
                : team.affiliation || "—";

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => openTeam(team.id)}
                  className={`grid w-full grid-cols-[1.4fr_1fr_90px] items-center gap-2 border-b border-border/60 px-4 py-3 text-left text-sm transition-colors ${
                    isSelected ? "bg-accent-soft" : "hover:bg-surface-2"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5 font-medium">
                    <span
                      className="h-6 w-1.5 shrink-0 rounded-full transition-colors"
                      style={{ background: displayColor }}
                    />
                    <span className="truncate">{displayName}</span>
                    {isSelected ? (
                      <span className="ml-1 rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent uppercase">
                        Editing
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-muted">{displayAffiliation}</span>
                  <span className="font-semibold">{totals[team.id] ?? 0}</span>
                </button>
              );
            })}
            {!activeTeams.length ? (
              <p className="px-4 py-6 text-sm text-muted">
                {teams.some((t) => t.visibility === "active")
                  ? "No active teams match that search."
                  : "No active teams yet. Add the first one."}
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-end justify-between gap-2 px-0.5">
            <div>
              <h2 className="font-display text-xl tracking-wide uppercase">
                Archived teams
              </h2>
              <p className="text-xs text-muted">
                Hidden from the public site. Permanently delete when no longer
                needed.
              </p>
            </div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {archivedTeams.length} archived
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="grid grid-cols-[1.4fr_1fr_90px_7.5rem] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
              <span>Team</span>
              <span>Affiliation</span>
              <span>Points</span>
              <span>Actions</span>
            </div>
            {archivedTeams.map((team) => {
              const isSelected = selected?.id === team.id;
              const displayName = isSelected ? previewName : team.name;
              const displayColor = isSelected ? previewColor : team.color_hex;
              const displayAffiliation = isSelected
                ? affiliation || "—"
                : team.affiliation || "—";

              return (
                <div
                  key={team.id}
                  className={`grid grid-cols-[1.4fr_1fr_90px_7.5rem] items-center gap-2 border-b border-border/60 px-4 py-3 text-sm ${
                    isSelected ? "bg-accent-soft" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openTeam(team.id)}
                    className="flex min-w-0 items-center gap-2.5 text-left font-medium hover:text-accent"
                  >
                    <span
                      className="h-6 w-1.5 shrink-0 rounded-full"
                      style={{ background: displayColor }}
                    />
                    <span className="truncate">{displayName}</span>
                    {isSelected ? (
                      <span className="ml-1 rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent uppercase">
                        Editing
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => openTeam(team.id)}
                    className="truncate text-left text-muted hover:text-foreground"
                  >
                    {displayAffiliation}
                  </button>
                  <span className="font-semibold text-muted">
                    {totals[team.id] ?? 0}
                  </span>
                  <form
                    action={deleteAction}
                    onSubmit={(e) => {
                      if (!confirmPermanentDelete(team.name)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={team.id} />
                    <SubmitButton
                      variant="danger"
                      className="h-8 w-full px-2 text-[11px]"
                    >
                      Delete forever
                    </SubmitButton>
                  </form>
                </div>
              );
            })}
            {!archivedTeams.length ? (
              <p className="px-4 py-6 text-sm text-muted">
                {teams.some((t) => t.visibility === "archived")
                  ? "No archived teams match that search."
                  : "No archived teams. Archive a team to move it here."}
              </p>
            ) : null}
          </div>
          <FormMessage state={deleteState} />
        </section>
      </div>

      <div
        className={`rounded-2xl border border-border bg-surface p-5 ${focus === "list" ? "hidden xl:block" : ""}`}
      >
        <button
          type="button"
          onClick={() => setFocus("list")}
          className="mb-3 inline-flex min-h-10 items-center text-sm font-medium text-accent xl:hidden"
        >
          ← Back to teams
        </button>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl">
              {isCreating ? "Add team" : "Edit team"}
            </h2>
            <p className="text-xs text-muted">
              {isCreating
                ? "Create a new roster entry for the active season."
                : `${previewName} · ${affiliation || "No affiliation"}`}
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
            Live Preview
          </span>
        </div>

        <TeamBanner
          name={previewName}
          colorHex={previewColor}
          artworkUrl={previewArtwork}
          ratio="16/9"
          className="mt-4 rounded-xl shadow-lg transition-all"
        />

        <form action={saveAction} className="mt-4 space-y-3.5">
          {selected ? <input type="hidden" name="id" value={selected.id} /> : null}
          <input
            type="hidden"
            name="artwork_url"
            value={selected?.artwork_url ?? ""}
          />

          <TextField
            label="Team name"
            name="name"
            value={name}
            required
            placeholder="e.g. Karasuno"
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              if (!slugTouched) {
                setSlug(slugify(newName));
              }
            }}
          />

          <TextField
            label="Slug"
            name="slug"
            value={slug}
            placeholder="lowercase-hyphen-slug"
            required
            hint="URL identifier (e.g. /teams/karasuno)"
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />

          <TextField
            label="Affiliation"
            name="affiliation"
            value={affiliation}
            placeholder="e.g. Section 2 or Transferees"
            onChange={(e) => setAffiliation(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium tracking-wide text-muted uppercase">
              Team Color (Hex & Swatch)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  colorHex.startsWith("#") && colorHex.length === 7
                    ? colorHex
                    : "#FF6B21"
                }
                onChange={(e) => setColorHex(e.target.value.toUpperCase())}
                className="size-10 cursor-pointer rounded-lg border border-border bg-surface-2 p-1"
                title="Pick custom color"
              />
              <input
                type="text"
                name="color_hex"
                value={colorHex}
                placeholder="#FF6B21"
                onChange={(e) => setColorHex(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="mr-1 text-[10px] font-semibold text-muted uppercase">
                Presets:
              </span>
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setColorHex(p.hex)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground transition hover:border-accent"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: p.hex }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium tracking-wide text-muted uppercase">
              Team artwork
            </span>
            <input
              type="file"
              name="artwork"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-xs file:font-semibold file:text-foreground hover:file:bg-accent hover:file:text-black"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (previewUrl?.startsWith("blob:"))
                  URL.revokeObjectURL(previewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
            />
            <span className="block text-[11px] text-muted">
              JPEG, PNG, WebP, or GIF up to 5MB. Leave empty to retain current
              court/artwork.
            </span>
          </label>

          <SelectField
            label="Public visibility"
            name="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="active">Active / visible</option>
            <option value="archived">Archived</option>
          </SelectField>

          <TextField
            label="Sort order"
            name="sort_order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />

          {!isCreating && selected ? (
            <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
              Current overall points:{" "}
              <span className="font-display text-xl text-accent">
                {totals[selected.id] ?? 0}
              </span>
            </div>
          ) : null}

          <FormMessage state={saveState} />
          <SubmitButton className="w-full">
            {isCreating ? "Create team" : "Save team"}
          </SubmitButton>
        </form>

        {selected && !isArchivedSelected ? (
          <form action={archiveAction} className="mt-3">
            <input type="hidden" name="id" value={selected.id} />
            <FormMessage state={archiveState} />
            <SubmitButton variant="ghost" className="w-full">
              Archive team
            </SubmitButton>
          </form>
        ) : null}

        {selected && isArchivedSelected ? (
          <form
            action={deleteAction}
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              if (!confirmPermanentDelete(selected.name)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={selected.id} />
            <FormMessage state={deleteState} />
            <SubmitButton variant="danger" className="w-full">
              Permanently delete from database
            </SubmitButton>
            <p className="text-[11px] leading-5 text-muted">
              Only available for archived teams. Scores for this team are
              removed. This cannot be undone.
            </p>
          </form>
        ) : null}
      </div>
    </div>
  );
}
