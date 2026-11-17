import Link from "next/link";
import type { StandingRow, CompetitionTeam } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

export function getTeamColor(team: CompetitionTeam): string {
  return team.color_hex || "#FF6B21";
}

const TAGLINES = ["Leading the flight", "The chase is on", "Eyes on the top"] as const;

function PodiumCard({
  row,
  index,
  leaderGap,
}: {
  row: StandingRow;
  index: number;
  /** Gap between rank-1 and rank-2 (positive number), only used for the leader card */
  leaderGap: number;
}) {
  const teamColor = getTeamColor(row.team);
  const tagline = TAGLINES[index] ?? "Top Contender";
  const rankLabel = String(row.rank).padStart(2, "0");
  const isLeader = row.rank === 1;

  // Gap text — leader: "Leading by X", others: "+X to reach #1"
  const gapText = isLeader
    ? `Leading by ${formatPoints(leaderGap)}`
    : `+${formatPoints(Math.abs(row.toLeader))} to reach #1`;

  return (
    <Link
      href={`/teams/${row.team.slug}`}
      className="group relative flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${teamColor}2e 0%, #17171b 70%)`,
        border: `1.5px solid ${teamColor}`,
        borderRadius: "18px",
        boxShadow: `0 8px 32px -8px ${teamColor}30`,
        padding: "18px 20px 16px",
        minHeight: "185px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Ghost watermark rank number */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-28px",
          right: "2px",
          fontSize: "160px",
          fontWeight: 900,
          lineHeight: 1,
          color: `${teamColor}15`,
          fontFamily: "var(--font-display, sans-serif)",
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {row.rank}
      </span>

      {/* ── Row 1: Rank number + tagline ── */}
      <div className="relative z-10 flex items-baseline gap-2">
        <span
          className="font-display font-black leading-none shrink-0"
          style={{ color: teamColor, fontSize: "26px" }}
        >
          {rankLabel}
        </span>
        <span
          className="font-bold uppercase text-neutral-400 truncate"
          style={{ fontSize: "10px", letterSpacing: "0.12em" }}
        >
          {tagline}
        </span>
      </div>

      {/* ── Row 2: Affiliation ── */}
      <p
        className="relative z-10 mt-4 font-semibold uppercase text-neutral-500"
        style={{ fontSize: "10px", letterSpacing: "0.1em" }}
      >
        {row.team.affiliation || "Unaffiliated"}
      </p>

      {/* ── Row 3: Team name ── */}
      <h3
        className="relative z-10 mt-0.5 font-display font-black uppercase text-white"
        style={{
          fontSize: "clamp(20px, 2.4vw, 28px)",
          lineHeight: 1.05,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {row.team.name}
      </h3>

      {/* ── Row 4: Points ── */}
      <div className="relative z-10 mt-2 flex items-baseline gap-1.5">
        <span
          className="font-display font-black text-white leading-none"
          style={{ fontSize: "clamp(34px, 4vw, 46px)" }}
        >
          {formatPoints(row.total)}
        </span>
        <span
          className="font-bold uppercase text-neutral-400"
          style={{ fontSize: "10px", letterSpacing: "0.14em" }}
        >
          PTS
        </span>
      </div>

      {/* ── Row 5: Gap text ── */}
      <p
        className="relative z-10 mt-1.5 font-medium text-neutral-500"
        style={{ fontSize: "11px" }}
      >
        {gapText}
      </p>
    </Link>
  );
}

export function Podium({ rows }: { rows: StandingRow[] }) {
  const top3 = rows.slice(0, 3);
  if (!top3.length) return null;

  const leaderTotal = top3[0]?.total ?? 0;
  const secondTotal = top3[1]?.total ?? leaderTotal;
  const leaderGap = leaderTotal - secondTotal;

  // Patch rank-1 row's toLeader so the gap text is accurate for the leader
  const patchedRows = top3.map((row, i) =>
    i === 0 ? { ...row, toLeader: leaderGap } : row
  );

  return (
    <>
      {/* Mobile: single-column stack */}
      <div className="flex flex-col gap-3 md:hidden">
        {patchedRows.map((row, i) => (
          <PodiumCard key={row.team.id} row={row} index={i} leaderGap={leaderGap} />
        ))}
      </div>

      {/* Tablet & Desktop: 3-column equal grid */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {patchedRows.map((row, i) => (
          <PodiumCard key={row.team.id} row={row} index={i} leaderGap={leaderGap} />
        ))}
      </div>
    </>
  );
}
