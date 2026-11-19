"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  archiveCategory,
  archiveCompetition,
  saveCategory,
  saveCompetition,
} from "@/app/actions/categories";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "../ui/form-message";
import { TextField } from "../ui/input";
import { SubmitButton } from "../submit-button";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  include_in_scoring: boolean;
};

type CompetitionRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sort_order: number;
};

const NEW = "new" as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function nextSort(rows: { sort_order: number }[]) {
  if (!rows.length) return 1;
  return Math.max(...rows.map((r) => r.sort_order)) + 1;
}

export function CategoryManager({
  categories,
  competitions,
}: {
  categories: CategoryRow[];
  competitions: CompetitionRow[];
}) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id ?? NEW,
  );
  const [selectedCompetitionId, setSelectedCompetitionId] =
    useState<string>(NEW);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [includeInScoring, setIncludeInScoring] = useState(true);
  const [compName, setCompName] = useState("");
  const [compSlug, setCompSlug] = useState("");

  const isCreatingCategory = selectedCategoryId === NEW;
  const selectedCategory = useMemo(
    () =>
      isCreatingCategory
        ? undefined
        : categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId, isCreatingCategory],
  );

  const categoryCompetitions = useMemo(
    () =>
      competitions
        .filter((c) => c.category_id === selectedCategory?.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [competitions, selectedCategory?.id],
  );

  const isCreatingCompetition = selectedCompetitionId === NEW;
  const selectedCompetition = useMemo(
    () =>
      isCreatingCompetition
        ? undefined
        : categoryCompetitions.find((c) => c.id === selectedCompetitionId),
    [categoryCompetitions, selectedCompetitionId, isCreatingCompetition],
  );

  useEffect(() => {
    if (selectedCategory) {
      setCatName(selectedCategory.name);
      setCatSlug(selectedCategory.slug);
      setIncludeInScoring(selectedCategory.include_in_scoring);
    } else {
      setCatName("");
      setCatSlug("");
      setIncludeInScoring(true);
    }
    setSelectedCompetitionId(NEW);
    setCompName("");
    setCompSlug("");
  }, [selectedCategoryId, selectedCategory]);

  useEffect(() => {
    if (selectedCompetition) {
      setCompName(selectedCompetition.name);
      setCompSlug(selectedCompetition.slug);
    } else if (isCreatingCompetition) {
      setCompName("");
      setCompSlug("");
    }
  }, [selectedCompetitionId, selectedCompetition, isCreatingCompetition]);

  const [catSaveState, catSaveAction] = useActionState(
    saveCategory,
    initialActionState,
  );
  const [catArchiveState, catArchiveAction] = useActionState(
    archiveCategory,
    initialActionState,
  );
  const [compSaveState, compSaveAction] = useActionState(
    saveCompetition,
    initialActionState,
  );
  const [compArchiveState, compArchiveAction] = useActionState(
    archiveCompetition,
    initialActionState,
  );

  useEffect(() => {
    if (selectedCategoryId !== NEW && !categories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id ?? NEW);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (catSaveState.ok) {
      if (catSaveState.id) setSelectedCategoryId(catSaveState.id);
      router.refresh();
    }
  }, [catSaveState.ok, catSaveState.id, catSaveState.message, router]);

  useEffect(() => {
    if (catArchiveState.ok) {
      setSelectedCategoryId(NEW);
      router.refresh();
    }
  }, [catArchiveState.ok, catArchiveState.message, router]);

  useEffect(() => {
    if (compSaveState.ok) {
      // Stay in create mode so another competition can be added immediately.
      setSelectedCompetitionId(NEW);
      setCompName("");
      setCompSlug("");
      router.refresh();
    }
  }, [compSaveState.ok, compSaveState.id, compSaveState.message, router]);

  useEffect(() => {
    if (compArchiveState.ok) {
      setSelectedCompetitionId(NEW);
      router.refresh();
    }
  }, [compArchiveState.ok, compArchiveState.message, router]);

  function startNewCategory() {
    setSelectedCategoryId(NEW);
    setCatName("");
    setCatSlug("");
    setIncludeInScoring(true);
    setSelectedCompetitionId(NEW);
    setCompName("");
    setCompSlug("");
  }

  function startNewCompetition() {
    setSelectedCompetitionId(NEW);
    setCompName("");
    setCompSlug("");
  }

  function selectCategory(id: string) {
    setSelectedCategoryId(id);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl">Categories</h2>
          <button
            type="button"
            onClick={startNewCategory}
            className={`rounded-lg border px-3 py-2 text-sm ${
              isCreatingCategory
                ? "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface-2"
            }`}
          >
            + Add
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-border bg-surface-2 px-3 py-2 text-[10px] tracking-wide text-muted uppercase">
            <span>Name</span>
            <span>Slug</span>
          </div>
          {categories.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              No categories yet. Use + Add to create one.
            </p>
          ) : (
            <ul>
              {categories.map((c) => (
                <li key={c.id} className="border-b border-border/60 last:border-0">
                  <button
                    type="button"
                    onClick={() => selectCategory(c.id)}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 px-3 py-2.5 text-left text-sm ${
                      selectedCategory?.id === c.id
                        ? "bg-accent-soft text-foreground"
                        : "hover:bg-surface-2"
                    }`}
                  >
                    <span className="font-medium">
                      {c.name}
                      {!c.include_in_scoring ? (
                        <span className="ml-2 text-[10px] font-normal tracking-wide text-muted uppercase">
                          events only
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-[10px] text-muted">{c.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          key={isCreatingCategory ? "new-category" : selectedCategoryId}
          action={catSaveAction}
          className="space-y-3 border-t border-border pt-4"
        >
          <p className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
            {isCreatingCategory ? "New category" : "Edit category"}
          </p>
          {selectedCategory ? (
            <input type="hidden" name="id" value={selectedCategory.id} />
          ) : null}
          <input
            type="hidden"
            name="sort_order"
            value={selectedCategory?.sort_order ?? nextSort(categories)}
          />
          <TextField
            label="Category name"
            name="name"
            value={catName}
            required
            error={catSaveState.errors?.name?.[0]}
            onChange={(e) => {
              const next = e.target.value;
              setCatName(next);
              if (isCreatingCategory || catSlug === slugify(catName)) {
                setCatSlug(slugify(next));
              }
            }}
          />
          <TextField
            label="Slug"
            name="slug"
            value={catSlug}
            required
            error={catSaveState.errors?.slug?.[0]}
            onChange={(e) => setCatSlug(slugify(e.target.value))}
          />
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="include_in_scoring"
              checked={includeInScoring}
              onChange={(e) => setIncludeInScoring(e.target.checked)}
              className="size-4 rounded border-border accent-accent"
            />
            Include in scoring
          </label>
          <p className="text-xs text-muted">
            When off, this category stays available for events but is hidden from
            score entry, the score matrix, and overall standings.
          </p>
          <FormMessage state={catSaveState} />
          <div className="flex flex-wrap gap-2">
            <SubmitButton>
              {isCreatingCategory ? "Create category" : "Save category"}
            </SubmitButton>
            {!isCreatingCategory ? (
              <button
                type="button"
                onClick={startNewCategory}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
              >
                New category
              </button>
            ) : null}
          </div>
        </form>
        {selectedCategory ? (
          <form action={catArchiveAction} className="mt-2">
            <input type="hidden" name="id" value={selectedCategory.id} />
            <FormMessage state={catArchiveState} />
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              Archive
            </button>
          </form>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl">Competitions</h2>
            <p className="mt-0.5 text-xs text-muted">
              {selectedCategory
                ? `In ${selectedCategory.name}`
                : "Select a category to view competitions"}
            </p>
          </div>
          <button
            type="button"
            disabled={!selectedCategory}
            onClick={startNewCompetition}
            className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${
              isCreatingCompetition && selectedCategory
                ? "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface-2"
            }`}
          >
            + Add
          </button>
        </div>

        {!selectedCategory ? (
          <div className="overflow-hidden rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted">
            Click a category on the left to see its competitions here.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-border bg-surface-2 px-3 py-2 text-[10px] tracking-wide text-muted uppercase">
              <span>Competition</span>
              <span>Slug</span>
            </div>
            {categoryCompetitions.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted">
                No competitions in this category yet. Use + Add to create one.
              </p>
            ) : (
              <ul>
                {categoryCompetitions.map((c) => (
                  <li
                    key={c.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCompetitionId(c.id)}
                      className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 px-3 py-2.5 text-left text-sm ${
                        selectedCompetition?.id === c.id
                          ? "bg-accent-soft text-foreground"
                          : "hover:bg-surface-2"
                      }`}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="font-mono text-[10px] text-muted">
                        {c.slug}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-xl">
          {isCreatingCompetition ? "New competition" : "Edit competition"}
        </h2>
        {!selectedCategory ? (
          <p className="mt-3 text-sm text-muted">
            Pick a category to manage competitions.
          </p>
        ) : (
          <form
            key={`${selectedCategory.id}:${selectedCompetitionId}:${compSaveState.ok ? compSaveState.id : "form"}`}
            action={compSaveAction}
            className="mt-4 space-y-3"
          >
            {selectedCompetition ? (
              <input type="hidden" name="id" value={selectedCompetition.id} />
            ) : null}
            <input type="hidden" name="category_id" value={selectedCategory.id} />
            <input
              type="hidden"
              name="sort_order"
              value={
                selectedCompetition?.sort_order ??
                nextSort(categoryCompetitions)
              }
            />
            <TextField
              label="Competition name"
              name="name"
              value={compName}
              required
              error={compSaveState.errors?.name?.[0]}
              onChange={(e) => {
                setCompName(e.target.value);
                if (isCreatingCompetition || compSlug === slugify(compName)) {
                  setCompSlug(slugify(e.target.value));
                }
              }}
            />
            <TextField
              label="Slug"
              name="slug"
              value={compSlug}
              required
              error={compSaveState.errors?.slug?.[0]}
              onChange={(e) => setCompSlug(slugify(e.target.value))}
            />
            <FormMessage state={compSaveState} />
            <div className="flex flex-wrap gap-2">
              <SubmitButton>
                {isCreatingCompetition
                  ? "Create competition"
                  : "Save competition"}
              </SubmitButton>
              {!isCreatingCompetition ? (
                <button
                  type="button"
                  onClick={startNewCompetition}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
                >
                  New competition
                </button>
              ) : null}
            </div>
          </form>
        )}
        {selectedCategory && selectedCompetition ? (
          <form action={compArchiveAction} className="mt-2">
            <input type="hidden" name="id" value={selectedCompetition.id} />
            <FormMessage state={compArchiveState} />
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              Archive
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
