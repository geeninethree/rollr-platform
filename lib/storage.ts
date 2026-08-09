import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadKind = "avatar" | "cover" | "work";

const BUCKET: Record<UploadKind, string> = {
  avatar: "avatars",
  cover: "covers",
  work: "portfolio",
};

const MAX_BYTES: Record<UploadKind, number> = {
  avatar: 5 * 1024 * 1024,
  cover: 8 * 1024 * 1024,
  work: 10 * 1024 * 1024,
};

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

/**
 * Upload image to Supabase Storage. Path: {userId}/{kind}-{timestamp}.{ext}
 * Returns public URL.
 */
export async function uploadCreatorImage(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  kind: UploadKind
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Please choose an image file (JPG, PNG, or WebP)." };
  }
  if (file.size > MAX_BYTES[kind]) {
    const mb = MAX_BYTES[kind] / (1024 * 1024);
    return { error: `Image too large. Max ${mb}MB for ${kind}.` };
  }

  const ext = extFromFile(file);
  const path = `${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const bucket = BUCKET[kind];

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || `image/${ext}`,
    });

  if (uploadError) {
    const msg = uploadError.message || "Upload failed";
    if (
      msg.toLowerCase().includes("bucket") ||
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("row-level security")
    ) {
      const mig =
        kind === "work"
          ? "00008_admin_reviews_portfolio.sql"
          : "00006_storage_avatars_covers.sql";
      return {
        error: `${msg} — run supabase/migrations/${mig} in the SQL Editor.`,
      };
    }
    return { error: msg };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    return { error: "Upload succeeded but public URL is missing." };
  }
  return { url: data.publicUrl };
}
