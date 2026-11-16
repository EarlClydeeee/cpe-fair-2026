const tones = {
  accent: "bg-accent-soft text-accent",
  muted: "bg-surface-2 text-muted",
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
  danger: "bg-danger/15 text-danger",
} as const;

export function Badge({
  children,
  tone = "muted",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
