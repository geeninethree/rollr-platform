import { formatPriceInr } from "@/lib/format";

export type MoneyLineItem = {
  description: string;
  quantity: number;
  unit_amount: number;
};

export function computeMoneyTotals(
  line_items: MoneyLineItem[],
  gst_percent: number
): { subtotal: number; gst_amount: number; total: number } {
  const subtotal = line_items.reduce(
    (sum, li) =>
      sum +
      Math.max(0, Number(li.quantity) || 0) *
        Math.max(0, Number(li.unit_amount) || 0),
    0
  );
  const gst = Math.max(0, Math.min(100, Number(gst_percent) || 0));
  const gst_amount = Math.round((subtotal * gst) / 100);
  return {
    subtotal: Math.round(subtotal),
    gst_amount,
    total: Math.round(subtotal + gst_amount),
  };
}

export function formatDocMoney(n: number): string {
  return formatPriceInr(n);
}

export function docNumber(prefix: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${y}${m}-${rand}`;
}

export function migrationHint(tableLabel: string): string {
  return `${tableLabel} not set up — run migration 00018 in Supabase SQL Editor.`;
}

export function isSchemaError(message: string): boolean {
  return (
    message.includes("schema") ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("quotes") ||
    message.includes("booking") ||
    message.includes("rate_card") ||
    message.includes("delivery")
  );
}
