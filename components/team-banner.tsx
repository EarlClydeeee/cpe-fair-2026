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

  const isTransparentGraphic =
    artworkUrl.endsWith(".png") || artworkUrl.endsWith(".svg");

  return (
    <div
      className={`relative overflow-hidden border border-border bg-surface-2 ${fill ? "size-full" : ""} ${className}`}
      style={{
        ...(fill ? {} : { aspectRatio: ratio }),
        background: `radial-gradient(circle at 50% 45%, ${colorHex}30, transparent 65%), #141416`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote/dynamic URLs */}
      <img
        src={artworkUrl}
        alt={`${name} banner`}
        className={
          isTransparentGraphic
            ? "absolute inset-0 m-auto max-h-[72%] max-w-[72%] object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]"
            : "absolute inset-0 size-full object-cover"
        }
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent"
        aria-hidden
      />
    </div>
  );
}
