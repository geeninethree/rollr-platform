import type { SupabaseClient } from "@supabase/supabase-js";
import {
  humanizeUploadError,
  kindLabel,
  maxMbForKind,
} from "@/lib/user-messages";

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

/** Longest edge after client compress (keeps quality, cuts phone multi‑MB files). */
const MAX_EDGE: Record<UploadKind, number> = {
  avatar: 1200,
  cover: 2000,
  work: 2000,
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

function isHeic(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  const n = file.name.toLowerCase();
  return (
    t.includes("heic") ||
    t.includes("heif") ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  );
}

/**
 * Shrink large phone photos before upload. Skips GIF (animation) and tiny files.
 */
async function prepareImageFile(file: File, kind: UploadKind): Promise<File> {
  if (typeof window === "undefined") return file;
  if (file.type === "image/gif") return file;
  if (file.size < 900 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = MAX_EDGE[kind];
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const quality = kind === "avatar" ? 0.85 : 0.82;
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || kind;
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Upload image to Supabase Storage. Path: {userId}/{kind}-{timestamp}.{ext}
 * Returns public URL. Errors are user-friendly (no migration / RLS text).
 */
export async function uploadCreatorImage(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  kind: UploadKind
): Promise<{ url?: string; error?: string }> {
  if (isHeic(file)) {
    return {
      error:
        "iPhone HEIC photos aren’t supported yet. Export as JPG or PNG and try again.",
    };
  }

  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
    return { error: "Please choose an image (JPG, PNG, or WebP)." };
  }

  let toUpload = file;
  try {
    toUpload = await prepareImageFile(file, kind);
  } catch {
    toUpload = file;
  }

  if (toUpload.size > MAX_BYTES[kind]) {
    const mb = maxMbForKind(kind);
    return {
      error: `This ${kindLabel(kind)} is too large (max ${mb} MB). Try a smaller photo or compress it first.`,
    };
  }

  const ext = extFromFile(toUpload);
  const path = `${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const bucket = BUCKET[kind];

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, toUpload, {
      cacheControl: "3600",
      upsert: true,
      contentType: toUpload.type || `image/${ext}`,
    });

  if (uploadError) {
    const msg = uploadError.message || "Upload failed";
    console.warn("[rollr] upload error:", kind, msg);
    return { error: humanizeUploadError(msg, kind) };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    return {
      error: `Uploaded, but we couldn’t get a link for your ${kindLabel(kind)}. Try again.`,
    };
  }
  return { url: data.publicUrl };
}

export function uploadSizeHint(kind: UploadKind): string {
  return `JPG, PNG or WebP · max ${maxMbForKind(kind)} MB`;
}
