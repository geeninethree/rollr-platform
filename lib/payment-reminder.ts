import { formatPriceInr, normaliseWhatsApp } from "@/lib/format";
import { whatsAppShareUrl } from "@/lib/doc-share";
import type { Invoice } from "@/lib/invoices";

/** Build WhatsApp payment reminder URL for an invoice (creator → client). */
export function invoicePaymentReminderWhatsAppUrl(input: {
  invoice: Invoice;
  shareUrl: string;
  creatorName?: string;
}): string | null {
  const phone = input.invoice.client_phone
    ? normaliseWhatsApp(input.invoice.client_phone)
    : "";
  // Prefer targeted message; still allow share without phone via generic WA
  const due = input.invoice.due_date
    ? ` Due date: ${input.invoice.due_date}.`
    : "";
  const who = input.creatorName || input.invoice.seller_name || "your creator";
  const text = [
    `Hi ${input.invoice.client_name},`,
    `Friendly reminder from ${who} (via ROLLR).`,
    `Invoice ${input.invoice.invoice_number} for ${formatPriceInr(input.invoice.total)} is still open.${due}`,
    `View / pay details: ${input.shareUrl}`,
    input.invoice.payment_note
      ? `Payment: ${input.invoice.payment_note}`
      : "Please pay the creator directly (UPI / bank) — ROLLR does not collect payment.",
  ].join(" ");

  if (phone && phone.length >= 10) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
  return whatsAppShareUrl({ text });
}

export function invoicePaymentReminderText(input: {
  invoice: Invoice;
  shareUrl: string;
  creatorName?: string;
}): string {
  const due = input.invoice.due_date
    ? ` Due: ${input.invoice.due_date}.`
    : "";
  return [
    `Hi ${input.invoice.client_name},`,
    `Reminder: invoice ${input.invoice.invoice_number} — ${formatPriceInr(input.invoice.total)}.${due}`,
    input.shareUrl,
    input.invoice.payment_note || "",
  ]
    .filter(Boolean)
    .join("\n");
}
