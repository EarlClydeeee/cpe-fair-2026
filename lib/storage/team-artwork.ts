import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const TEAM_ARTWORK_BUCKET = "team-artwork";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFor(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "bin";
}

export function isArtworkFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

export async function uploadTeamArtwork(
  supabase: SupabaseClient<Database>,
  file: File,
  teamKey: string,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Upload a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 5MB." };
  }

  const path = `${teamKey}/${Date.now()}.${extensionFor(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(TEAM_ARTWORK_BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    return {
      error:
        error.message.includes("Bucket not found") || error.message.includes("not found")
          ? "Artwork storage is not set up yet. Run db/migrations/0005_team_artwork_storage.sql in the Supabase SQL editor."
          : error.message,
    };
  }

  const { data } = supabase.storage.from(TEAM_ARTWORK_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
