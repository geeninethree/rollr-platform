import { formatPriceInr, normaliseWhatsApp } from "@/lib/format";

/** Open WhatsApp with prefilled text. Uses client phone when available. */
export function whatsAppShareUrl(input: {
  phone?: string | null;
  text: string;
}): string {
  const phone = input.phone ? normaliseWhatsApp(input.phone) : "";
  const q = encodeURIComponent(input.text);
  if (phone && phone.length >= 10) {
    return `https://wa.me/${phone}?text=${q}`;
  }
  // No number — open WhatsApp with text only (user picks contact)
  return `https://wa.me/?text=${q}`;
}

export function shareDocWhatsAppUrl(input: {
  clientPhone?: string | null;
  clientName?: string | null;
  creatorName?: string | null;
  /** e.g. "quote", "booking confirmation", "invoice", "delivery note" */
  docKind: string;
  docNumber?: string | null;
  shareUrl: string;
  amount?: number | null;
  extraLines?: string[];
}): string {
  const hi = input.clientName?.trim()
    ? `Hi ${input.clientName.trim()},`
    : "Hi,";
  const who = input.creatorName?.trim() || "your creator";
  const num = input.docNumber ? ` ${input.docNumber}` : "";
  const amount =
    typeof input.amount === "number" && input.amount > 0
      ? ` (${formatPriceInr(input.amount)})`
      : "";
  const lines = [
    hi,
    `This is ${who} on ROLLR.`,
    `Here’s your ${input.docKind}${num}${amount}:`,
    input.shareUrl,
    ...(input.extraLines || []).filter(Boolean),
  ];
  return whatsAppShareUrl({
    phone: input.clientPhone,
    text: lines.join(" "),
  });
}

export function openWhatsAppShare(url: string) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}
