"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyLinkButtonProps = {
  url: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  shareTitle?: string;
  shareText?: string;
};

export function CopyLinkButton({
  url,
  label = "Copy link",
  variant = "outline",
  size = "sm",
  className,
  shareTitle = "ROLLR profile",
  shareText,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      window.prompt("Copy this link:", url);
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText || shareTitle,
          url,
        });
        return;
      } catch {
        /* user cancelled or not supported */
      }
    }
    await copy();
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        className="font-medium"
        onClick={() => void copy()}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-primary" />
            Copied
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size={size}
        className="font-medium"
        onClick={() => void share()}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
