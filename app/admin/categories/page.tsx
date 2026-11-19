import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAdminCategories } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Categories" };
export const instant = false;

async function CategoriesContent() {
  await connection();
  const { categories, competitions } = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl leading-none sm:text-5xl">
          Categories & Competitions
        </h1>
        <p className="mt-2 text-sm text-muted">
          Create categories, then nest competitions under each. Scores and events attach
          to a competition. Uncheck “Include in scoring” to keep a category for events
          only (hidden from score entry and overall standings).
        </p>
      </div>
      <CategoryManager categories={categories} competitions={competitions} />
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          Loading categories…
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
