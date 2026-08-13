"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  uploadCreatorImage,
  uploadSizeHint,
  type UploadKind,
} from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { connectionErrorMessage, kindLabel } from "@/lib/user-messages";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  label: string;
  kind: UploadKind;
  userId: string;
  value: string;
  onChange: (url: string) => void;
  aspectClass?: string;
};

export function ImageUploadField({
  label,
  kind,
  userId,
  value,
  onChange,
  aspectClass = "aspect-square",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setOkMsg(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(connectionErrorMessage());
      return;
    }
    setUploading(true);
    try {
      const result = await uploadCreatorImage(supabase, userId, file, kind);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        onChange(result.url);
        setOkMsg(`${kindLabel(kind).replace(/^./, (c) => c.toUpperCase())} uploaded`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <button
          type="button"
          className="shrink-0 text-[11px] text-primary hover:underline"
          onClick={() => setShowUrl((v) => !v)}
        >
          {showUrl ? "Hide URL" : "Use URL instead"}
        </button>
      </div>

      <div className="flex min-w-0 gap-3">
        <div
          className={cn(
            "relative w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary sm:w-24",
            aspectClass
          )}
        >
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={value.includes("supabase.co")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImagePlus className="h-6 w-6 opacity-40" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-w-full font-medium"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {uploadSizeHint(kind)}
          </p>
          {error && (
            <p className="text-[11px] leading-snug text-destructive" role="alert">
              {error}
            </p>
          )}
          {okMsg && !error && (
            <p className="text-[11px] text-emerald-400/90">{okMsg}</p>
          )}
        </div>
      </div>

      {showUrl && (
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOkMsg(null);
          }}
          placeholder="https://…"
          className="bg-background/50 text-xs"
        />
      )}
    </div>
  );
}
