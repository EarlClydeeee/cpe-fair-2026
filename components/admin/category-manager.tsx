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
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(NEW);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
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
    } else {
      setCatName("");
      setCatSlug("");
    }
    setSelectedCompetitionId(NEW);
    setCompName("");
    setCompSlug("");
  }, [selectedCategory?.id, selectedCategory?.name, selectedCategory?.slug]);

  useEffect(() => {
    if (selectedCompetition) {
      setCompName(selectedCompetition.name);
      setCompSlug(selectedCompetition.slug);
    } else {
      setCompName("");
      setCompSlug("");
    }
  }, [selectedCompetition?.id, selectedCompetition?.name, selectedCompetition?.slug]);

  const [catSaveState, catSaveAction] = useActionState(saveCategory, initialActionState);
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
    if (
      catSaveState.ok ||
      catArchiveState.ok ||
      compSaveState.ok ||
      compArchiveState.ok
    ) {
      router.refresh();
    }
  }, [
    catSaveState.ok,
    catSaveState.message,
    catArchiveState.ok,
    catArchiveState.message,
    compSaveState.ok,
    compSaveState.message,
    compArchiveState.ok,
    compArchiveState.message,
    router,
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl">Categories</h2>
          <button
            type="button"
            onClick={() => setSelectedCategoryId(NEW)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              isCreatingCategory
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface-2"
            }`}
          >
            + Add
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">No categories yet. Create the first one.</p>
        ) : (
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${
                    selectedCategory?.id === c.id
                      ? "bg-accent-soft text-foreground"
                      : "hover:bg-surface-2"
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-[10px] text-muted">{c.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <form action={catSaveAction} className="space-y-3 border-t border-border pt-4">
          {selectedCategory ? (
            <input type="hidden" name="id" value={selectedCategory.id} />
          ) : null}
          <input
            type="hidden"
            name="sort_order"
            value={
              selectedCategory?.sort_order ?? nextSort(categories)
            }
          />
          <TextField
            label="Category name"
            name="name"
            value={catName}
            required
            error={catSaveState.errors?.name?.[0]}
            onChange={(e) => {
              setCatName(e.target.value);
              if (isCreatingCategory || catSlug === slugify(catName)) {
                setCatSlug(slugify(e.target.value));
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
          <FormMessage state={catSaveState} />
          <div className="flex flex-wrap gap-2">
            <SubmitButton>{isCreatingCategory ? "Create category" : "Save category"}</SubmitButton>
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
          <h2 className="font-display text-xl">Competitions</h2>
          <button
            type="button"
            disabled={!selectedCategory}
            onClick={() => {
              setSelectedCompetitionId(NEW);
              setCompName("");
              setCompSlug("");
            }}
            className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${
              isCreatingCompetition && selectedCategory
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface-2"
            }`}
          >
            + Add
          </button>
        </div>
        {!selectedCategory ? (
          <p className="text-sm text-muted">Select or create a category first.</p>
        ) : categoryCompetitions.length === 0 ? (
          <p className="text-sm text-muted">
            No competitions in {selectedCategory.name} yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {categoryCompetitions.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCompetitionId(c.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${
                    selectedCompetition?.id === c.id
                      ? "bg-accent-soft text-foreground"
                      : "hover:bg-surface-2"
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-[10px] text-muted">{c.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-xl">
          {isCreatingCompetition ? "New competition" : "Edit competition"}
        </h2>
        {!selectedCategory ? (
          <p className="mt-3 text-sm text-muted">Pick a category to manage competitions.</p>
        ) : (
          <form action={compSaveAction} className="mt-4 space-y-3">
            {selectedCompetition ? (
              <input type="hidden" name="id" value={selectedCompetition.id} />
            ) : null}
            <input type="hidden" name="category_id" value={selectedCategory.id} />
            <input
              type="hidden"
              name="sort_order"
              value={
                selectedCompetition?.sort_order ?? nextSort(categoryCompetitions)
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
                {isCreatingCompetition ? "Create competition" : "Save competition"}
              </SubmitButton>
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
