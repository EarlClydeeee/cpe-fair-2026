import { Placeholder } from "@/components/placeholder";

type TeamBannerProps = {
  name: string;
  colorHex: string;
  artworkUrl?: string | null;
  ratio?: string;
  /** Stretch to parent bounds instead of locking an aspect ratio. */
  fill?: boolean;
  className?: string;
};

export function TeamBanner({
  name,
  colorHex,
  artworkUrl,
  ratio = "16/9",
  fill = false,
  className = "",
}: TeamBannerProps) {
  if (!artworkUrl) {
    return (
      <Placeholder
        label={name}
        ratio={fill ? "" : ratio}
        color={colorHex}
        quiet={fill}
        className={`${fill ? "size-full border-0 border-solid" : ""} ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden border border-border bg-surface-2 ${fill ? "size-full" : ""} ${className}`}
      style={{
        ...(fill ? {} : { aspectRatio: ratio }),
        background: `radial-gradient(circle at 50% 40%, ${colorHex}33, transparent 55%), #151515`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied remote URLs */}
      <img
        src={artworkUrl}
        alt={`${name} banner`}
        className="absolute inset-0 size-full object-cover"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent"
        aria-hidden
      />
    </div>
  );
}
