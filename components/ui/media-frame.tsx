"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type MediaFrameProps = {
  className?: string;
  /** Solid fallback when image fails (default dark charcoal) */
  fallbackClassName?: string;
  children?: React.ReactNode;
};

/**
 * Hard clip box for any cover media. Parent must set size
 * (fixed height, aspect-ratio, or both). Prevents next/image
 * fill from expanding the page when layout CSS races or fails.
 */
export function MediaFrame({
  className,
  fallbackClassName,
  children,
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        "media-frame relative isolate min-h-0 min-w-0 overflow-hidden",
        fallbackClassName ?? "bg-secondary",
        className
      )}
    >
      {children}
    </div>
  );
}

type CoverImageProps = Omit<ImageProps, "fill" | "src"> & {
  src: string | null | undefined;
  /** Extra classes on the img */
  imageClassName?: string;
  frameClassName?: string;
};

/**
 * Cover photo that never blows out layout: always object-cover inside a frame.
 * On error, shows a quiet gradient — never a broken/stretched asset.
 */
export function CoverImage({
  src,
  alt,
  sizes,
  priority,
  quality,
  imageClassName,
  frameClassName,
  className,
}: CoverImageProps) {
  const [failed, setFailed] = useState(false);
  const safe = Boolean(src && src.trim() && !failed);

  return (
    <MediaFrame className={cn("absolute inset-0 h-full w-full", frameClassName, className)}>
      {safe ? (
        <Image
          src={src as string}
          alt={alt ?? ""}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
          priority={priority}
          quality={quality}
          onError={() => setFailed(true)}
          className={cn("object-cover object-center", imageClassName)}
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-secondary via-[hsl(240_5%_10%)] to-[hsl(42_30%_12%)]"
          aria-hidden
        />
      )}
    </MediaFrame>
  );
}
