type PlaceholderProps = {
  label: string;
  ratio?: string;
  className?: string;
  color?: string;
  /** Hide the centered label copy (useful when text is overlaid elsewhere). */
  quiet?: boolean;
};

export function Placeholder({
  label,
  ratio,
  className = "",
  color = "#FF6B21",
  quiet = false,
}: PlaceholderProps) {
  const aspectRatio = ratio === undefined ? "16/9" : ratio || undefined;
  return (
    <div
      className={`grid place-items-center overflow-hidden border border-dashed border-border bg-surface-2 text-muted ${className}`}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        background: `radial-gradient(circle at 50% 40%, ${color}33, transparent 55%), #151515`,
      }}
      role="img"
      aria-label={`${label} placeholder`}
    >
      {quiet ? null : (
        <div className="px-4 text-center">
          <p className="font-display text-sm tracking-[0.18em] uppercase">{label}</p>
          <p className="mt-1 text-[10px] tracking-wide uppercase opacity-60">
            Artwork placeholder
          </p>
        </div>
      )}
    </div>
  );
}
