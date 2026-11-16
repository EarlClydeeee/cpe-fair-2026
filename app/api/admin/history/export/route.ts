import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLog } from "@/lib/data/admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await getAuditLog();
  const lines = ["created_at,action,entity_type,summary"].concat(
    rows.map((r) =>
      [r.created_at, r.action, r.entity_type, csv(r.summary)].join(","),
    ),
  );

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="history.csv"',
    },
  });
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
