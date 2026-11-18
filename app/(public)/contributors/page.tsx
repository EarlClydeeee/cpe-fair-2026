import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import path from "node:path";

export const metadata: Metadata = { title: "Contributors" };
export const instant = false;

const CONTRIBUTORS = [
  {
    name: "Charles Zachary DG Nudalo",
    fileStem: "charles-zachary-dg-nudalo",
  },
  {
    name: "Earl Clyde M. Bañez",
    fileStem: "earl-clyde-m-banez",
  },
] as const;

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

function resolveContributorPhoto(fileStem: string): string | null {
  const dir = path.join(process.cwd(), "public", "contributors");
  for (const ext of IMAGE_EXTS) {
    if (existsSync(path.join(dir, `${fileStem}${ext}`))) {
      return `/contributors/${fileStem}${ext}`;
    }
  }
  return null;
}

export default function ContributorsPage() {
  const people = CONTRIBUTORS.map((person) => ({
    ...person,
    photo: resolveContributorPhoto(person.fileStem),
  }));

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,33,0.14),transparent_55%),linear-gradient(180deg,var(--surface)_0%,var(--background)_45%)]"
      />
      <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[10px] tracking-[0.22em] text-accent uppercase">
          With gratitude
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none tracking-wide sm:text-6xl">
          Contributors
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          Thank you to the people who designed and built this ACCESS CPE Fair 2026
          website.
        </p>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {people.map((person, index) => (
            <li key={person.fileStem} className="space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
                {person.photo ? (
                  <Image
                    src={person.photo}
                    alt={person.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    priority={index === 0}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                      Photo soon
                    </span>
                    <span className="text-xs text-muted">
                      Add{" "}
                      <code className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-foreground">
                        public/contributors/{person.fileStem}.jpg
                      </code>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-2xl leading-none tracking-wide sm:text-3xl">
                  {person.name}
                </h2>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/leaderboard"
          className="mt-12 inline-flex text-sm text-accent transition-colors hover:brightness-110"
        >
          ← Back to leaderboard
        </Link>
      </div>
    </div>
  );
}
