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

export function TeamManager({
  teams,
  totals,
}: {
  teams: TeamRow[];
  totals: Record<string, number>;
}) {
  const [selectedId, setSelectedId] = useState<string>(teams[0]?.id ?? NEW_TEAM);
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "active" | "archived">("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [focus, setFocus] = useState<"list" | "editor">("list");

  const isCreating = selectedId === NEW_TEAM;
  const selected = useMemo(
    () => (isCreating ? undefined : teams.find((t) => t.id === selectedId)),
    [teams, selectedId, isCreating],
  );

  // Real-time controlled form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [affiliation, setAffiliation] = useState("");
  const [colorHex, setColorHex] = useState("#FF6B21");
  const [visibility, setVisibility] = useState("active");
  const [sortOrder, setSortOrder] = useState<number>(1);

  // Reset/sync form values when selected team changes
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
  const [archiveState, archiveAction] = useActionState(archiveTeam, initialActionState);

  // Filtered teams list
  const filtered = useMemo(() => {
    return teams.filter((t) => {
      if (t.id === selectedId) return true;
      const matchesSearch = t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.affiliation.toLowerCase().includes(query.toLowerCase());
      if (!matchesSearch) return false;
      if (visibilityFilter === "all") return true;
      return t.visibility === visibilityFilter;
    });
  }, [teams, query, visibilityFilter]);

  // Real-time preview values
  const previewName = name.trim() || (isCreating ? "New team" : (selected?.name ?? "Team"));
  const previewColor = colorHex || "#FF6B21";
  const previewArtwork = previewUrl ?? selected?.artwork_url ?? null;

  function openTeam(id: string) {
    setSelectedId(id);
    setFocus("editor");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      {/* Left Column: Team Directory & Filters */}
      <div className={`space-y-4 ${focus === "editor" ? "hidden xl:block" : ""}`}>
        {/* Search, Filter Tabs & Add Team Button */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team or affiliation..."
            className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted/60"
          />

          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5 text-xs">
            {(["all", "active", "archived"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setVisibilityFilter(filter)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize transition ${
                  visibilityFilter === filter
                    ? "bg-surface text-accent shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

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

        {/* Directory List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[1.4fr_1fr_90px_90px] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
            <span>Team</span>
            <span>Affiliation</span>
            <span>Points</span>
            <span>Visibility</span>
          </div>
          {filtered.map((team) => {
            const isSelected = selected?.id === team.id;
            // Reflect real-time edits if this is the currently selected team
            const displayName = isSelected ? previewName : team.name;
            const displayColor = isSelected ? previewColor : team.color_hex;
            const displayAffiliation = isSelected ? (affiliation || "—") : (team.affiliation || "—");
            const displayVisibility = isSelected ? visibility : team.visibility;

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => openTeam(team.id)}
                className={`grid w-full grid-cols-[1.4fr_1fr_90px_90px] items-center gap-2 border-b border-border/60 px-4 py-3 text-left text-sm transition-colors ${
                  isSelected ? "bg-accent-soft" : "hover:bg-surface-2"
                }`}
              >
                <span className="flex items-center gap-2.5 font-medium min-w-0">
                  <span
                    className="h-6 w-1.5 shrink-0 rounded-full transition-colors"
                    style={{ background: displayColor }}
                  />
                  <span className="truncate">{displayName}</span>
                  {isSelected ? (
                    <span className="ml-1 rounded bg-accent/20 px-1.5 py-0.2 text-[9px] font-semibold text-accent uppercase">
                      Editing
                    </span>
                  ) : null}
                </span>
                <span className="truncate text-muted">{displayAffiliation}</span>
                <span className="font-semibold">{totals[team.id] ?? 0}</span>
                <span
                  className={`text-xs uppercase font-medium ${
                    displayVisibility === "active" ? "text-success" : "text-muted"
                  }`}
                >
                  {displayVisibility}
                </span>
              </button>
            );
          })}
          {!filtered.length ? (
            <p className="px-4 py-6 text-sm text-muted">
              {teams.length ? "No teams match that search or filter." : "No teams yet. Add the first one."}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {teams.filter((t) => t.visibility === "active").length} active ·{" "}
            {teams.filter((t) => t.visibility === "archived").length} archived
          </span>
          <span>Select a team to edit. The row updates as you type.</span>
        </div>
      </div>

      {/* Right Column: Live Editor with Real-Time Preview */}
      <div className={`rounded-2xl border border-border bg-surface p-5 ${focus === "list" ? "hidden xl:block" : ""}`}>
        <button
          type="button"
          onClick={() => setFocus("list")}
          className="mb-3 inline-flex min-h-10 items-center text-sm font-medium text-accent xl:hidden"
        >
          ← Back to teams
        </button>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl">{isCreating ? "Add team" : "Edit team"}</h2>
            <p className="text-xs text-muted">
              {isCreating
                ? "Create a new roster entry for the active season."
                : `${previewName} · ${affiliation || "No affiliation"}`}
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Live Preview
          </span>
        </div>

        {/* Real-time Team Banner Preview */}
        <TeamBanner
          name={previewName}
          colorHex={previewColor}
          artworkUrl={previewArtwork}
          ratio="16/9"
          className="mt-4 rounded-xl shadow-lg transition-all"
        />

        <form action={saveAction} className="mt-4 space-y-3.5">
          {selected ? <input type="hidden" name="id" value={selected.id} /> : null}
          <input type="hidden" name="artwork_url" value={selected?.artwork_url ?? ""} />

          {/* Team Name */}
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

          {/* Slug */}
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

          {/* Affiliation */}
          <TextField
            label="Affiliation"
            name="affiliation"
            value={affiliation}
            placeholder="e.g. Section 2 or Transferees"
            onChange={(e) => setAffiliation(e.target.value)}
          />

          {/* Team Color with Real-Time Color Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium tracking-wide text-muted uppercase">
              Team Color (Hex & Swatch)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorHex.startsWith("#") && colorHex.length === 7 ? colorHex : "#FF6B21"}
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
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:border-accent"
              />
            </div>
            {/* Quick Palette */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-muted mr-1 font-semibold uppercase">Presets:</span>
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setColorHex(p.hex)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground transition hover:border-accent"
                >
                  <span className="size-2.5 rounded-full" style={{ background: p.hex }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Artwork Upload */}
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
                if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
            />
            <span className="block text-[11px] text-muted">
              JPEG, PNG, WebP, or GIF up to 5MB. Leave empty to retain current court/artwork.
            </span>
          </label>

          {/* Visibility */}
          <SelectField
            label="Public visibility"
            name="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="active">Active / visible</option>
            <option value="archived">Archived</option>
          </SelectField>

          {/* Sort Order */}
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
