type PlaceholderProps = {
  label: string;
  ratio?: string;
  className?: string;
  color?: string;
};

export function Placeholder({
  label,
  ratio = "16/9",
  className = "",
  color = "#FF6B21",
}: PlaceholderProps) {
  return (
    <div
      className={`grid place-items-center overflow-hidden border border-dashed border-border bg-surface-2 text-muted ${className}`}
      style={{
        aspectRatio: ratio,
        background: `radial-gradient(circle at 50% 40%, ${color}33, transparent 55%), #151515`,
      }}
      role="img"
      aria-label={`${label} placeholder`}
    >
      <div className="px-4 text-center">
        <p className="font-display text-sm tracking-[0.18em] uppercase">{label}</p>
        <p className="mt-1 text-[10px] tracking-wide uppercase opacity-60">Artwork placeholder</p>
      </div>
    </div>
  );
}
