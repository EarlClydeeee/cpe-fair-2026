import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getEvent } from "@/lib/data/public";
import { dayLabel, eventStatusLabel, formatDateTime } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/events" className="text-sm text-muted hover:text-accent">
        ← Back to events
      </Link>
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge tone="accent">{event.categories?.name ?? "Event"}</Badge>
        <Badge
          tone={
            event.status === "in_progress"
              ? "accent"
              : event.status === "final"
                ? "info"
                : "muted"
          }
        >
          {eventStatusLabel(event.status)}
        </Badge>
      </div>
      <h1 className="mt-4 font-display text-5xl">{event.title}</h1>
      <p className="mt-4 text-muted">
        {event.team_a && event.team_b
          ? `${event.team_a.name} vs ${event.team_b.name}`
          : event.notes || "All eight teams"}
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-[10px] tracking-wide text-muted uppercase">When</dt>
          <dd className="mt-1 font-medium">
            {dayLabel(event.day_number)} · {formatDateTime(event.starts_at)}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-[10px] tracking-wide text-muted uppercase">Venue</dt>
          <dd className="mt-1 font-medium">{event.venue || "TBA"}</dd>
        </div>
      </dl>
    </div>
  );
}
