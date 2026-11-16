import { NextResponse } from "next/server";
import { getCurrentUser, canScore } from "@/lib/auth";
import { getStandings } from "@/lib/data/public";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.role || (!canScore(user.role) && user.role !== "site_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { categories, rows } = await getStandings();
  const header = ["rank", "team", "affiliation", ...categories.map((c) => c.slug), "total"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.rank,
        csv(row.team.name),
        csv(row.team.affiliation),
        ...categories.map((c) => row.byCategory[c.slug] ?? 0),
        row.total,
      ].join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="scores.csv"',
    },
  });
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
