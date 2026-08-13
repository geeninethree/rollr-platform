"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openWhatsAppShare, shareDocWhatsAppUrl } from "@/lib/doc-share";

type ShareWhatsAppButtonProps = {
  clientPhone?: string | null;
  clientName?: string | null;
  creatorName?: string | null;
  docKind: string;
  docNumber?: string | null;
  shareUrl: string;
  amount?: number | null;
  extraLines?: string[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
};

/** One-tap WhatsApp share for any creator document link. */
export function ShareWhatsAppButton({
  clientPhone,
  clientName,
  creatorName,
  docKind,
  docNumber,
  shareUrl,
  amount,
  extraLines,
  variant = "outline",
  size = "default",
  className,
  label,
}: ShareWhatsAppButtonProps) {
  if (!shareUrl) return null;

  function onClick() {
    const url = shareDocWhatsAppUrl({
      clientPhone,
      clientName,
      creatorName,
      docKind,
      docNumber,
      shareUrl,
      amount,
      extraLines,
    });
    openWhatsAppShare(url);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
    >
      <MessageCircle className="h-4 w-4" />
      {label ||
        (clientPhone ? "WhatsApp client" : "Share on WhatsApp")}
    </Button>
  );
}
