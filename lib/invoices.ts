import type { SupabaseClient } from "@supabase/supabase-js";
import type { Inquiry } from "@/lib/types";
import { formatPriceInr } from "@/lib/format";

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_amount: number;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export type Invoice = {
  id: string;
  creator_user_id: string;
  inquiry_id?: string | null;
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  seller_name: string;
  seller_email?: string | null;
  seller_phone?: string | null;
  seller_gstin?: string | null;
  seller_address?: string | null;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  line_items: InvoiceLineItem[];
  currency: string;
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  total: number;
  notes?: string | null;
  payment_note?: string | null;
  status: InvoiceStatus;
  public_token: string;
  created_at: string;
  updated_at: string;
};

export type CreateInvoiceInput = {
  inquiry_id?: string | null;
  seller_name: string;
  seller_email?: string;
  seller_phone?: string;
  seller_gstin?: string;
  seller_address?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  line_items: InvoiceLineItem[];
  gst_percent?: number;
  notes?: string;
  payment_note?: string;
  due_date?: string;
  status?: InvoiceStatus;
};

function rowToInvoice(row: Record<string, unknown>): Invoice {
  const items = Array.isArray(row.line_items)
    ? (row.line_items as InvoiceLineItem[])
    : [];
  return {
    id: String(row.id),
    creator_user_id: String(row.creator_user_id),
    inquiry_id: row.inquiry_id ? String(row.inquiry_id) : null,
    invoice_number: String(row.invoice_number || ""),
    issue_date: String(row.issue_date || ""),
    due_date: row.due_date ? String(row.due_date) : null,
    seller_name: String(row.seller_name || ""),
    seller_email: (row.seller_email as string) || null,
    seller_phone: (row.seller_phone as string) || null,
    seller_gstin: (row.seller_gstin as string) || null,
    seller_address: (row.seller_address as string) || null,
    client_name: String(row.client_name || ""),
    client_email: (row.client_email as string) || null,
    client_phone: (row.client_phone as string) || null,
    client_address: (row.client_address as string) || null,
    line_items: items,
    currency: String(row.currency || "INR"),
    subtotal: Number(row.subtotal || 0),
    gst_percent: Number(row.gst_percent || 0),
    gst_amount: Number(row.gst_amount || 0),
    total: Number(row.total || 0),
    notes: (row.notes as string) || null,
    payment_note: (row.payment_note as string) || null,
    status: (row.status as InvoiceStatus) || "draft",
    public_token: String(row.public_token || ""),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export function computeTotals(
  line_items: InvoiceLineItem[],
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

export function nextInvoiceNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ROLLR-${y}${m}-${rand}`;
}

export function draftFromInquiry(
  inquiry: Inquiry,
  seller: { name: string; email?: string; phone?: string }
): CreateInvoiceInput {
  const amount =
    Number(String(inquiry.budget || "").replace(/[^\d.]/g, "")) || 0;
  return {
    inquiry_id: inquiry.id.startsWith("inq_") ? null : inquiry.id,
    seller_name: seller.name,
    seller_email: seller.email,
    seller_phone: seller.phone,
    client_name: inquiry.client_name,
    client_email: inquiry.client_email,
    client_phone: inquiry.client_whatsapp,
    line_items: [
      {
        description: [
          inquiry.brief_type === "edit"
            ? "Editing / post"
            : inquiry.brief_type === "full_package"
              ? "Shoot + edit package"
              : "Shoot / coverage",
          inquiry.category,
          inquiry.location,
          inquiry.event_date,
        ]
          .filter(Boolean)
          .join(" · "),
        quantity: 1,
        unit_amount: amount > 0 ? amount : 0,
      },
    ],
    gst_percent: 0,
    notes: inquiry.message
      ? `Related brief: ${inquiry.message.slice(0, 200)}`
      : undefined,
    payment_note: "Pay creator directly (UPI / bank). ROLLR does not collect payment.",
    status: "draft",
  };
}

export async function fetchMyInvoices(
  supabase: SupabaseClient,
  userId: string
): Promise<{ invoices: Invoice[]; error?: string }> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[rollr] fetchMyInvoices", error.message);
    return {
      invoices: [],
      error:
        error.message.includes("invoices") || error.message.includes("schema")
          ? "Invoices table not ready — run migration 00017 in Supabase."
          : "Couldn’t load invoices.",
    };
  }
  return {
    invoices: (data || []).map((r) => rowToInvoice(r as Record<string, unknown>)),
  };
}

export async function fetchInvoiceByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ invoice?: Invoice; error?: string }> {
  const { data, error } = await supabase.rpc("get_invoice_by_token", {
    p_token: token.trim(),
  });

  if (error) {
    console.warn("[rollr] fetchInvoiceByToken", error.message);
    return { error: "Invoice not found." };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Invoice not found." };
  return { invoice: rowToInvoice(row as Record<string, unknown>) };
}

export async function fetchInvoiceById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<{ invoice?: Invoice; error?: string }> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("creator_user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { error: "Invoice not found." };
  }
  return { invoice: rowToInvoice(data as Record<string, unknown>) };
}

export async function createInvoice(
  supabase: SupabaseClient,
  userId: string,
  input: CreateInvoiceInput
): Promise<{ invoice?: Invoice; error?: string }> {
  const items = (input.line_items || [])
    .map((li) => ({
      description: (li.description || "").trim().slice(0, 300),
      quantity: Math.max(0, Number(li.quantity) || 0),
      unit_amount: Math.max(0, Number(li.unit_amount) || 0),
    }))
    .filter((li) => li.description);

  if (items.length === 0) {
    return { error: "Add at least one line item." };
  }
  if (!input.seller_name.trim() || !input.client_name.trim()) {
    return { error: "Seller and client names are required." };
  }

  const gst_percent = Math.max(0, Math.min(100, Number(input.gst_percent) || 0));
  const { subtotal, gst_amount, total } = computeTotals(items, gst_percent);

  const payload = {
    creator_user_id: userId,
    inquiry_id: input.inquiry_id || null,
    invoice_number: nextInvoiceNumber(),
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: input.due_date || null,
    seller_name: input.seller_name.trim().slice(0, 120),
    seller_email: input.seller_email?.trim().slice(0, 200) || null,
    seller_phone: input.seller_phone?.trim().slice(0, 40) || null,
    seller_gstin: input.seller_gstin?.trim().slice(0, 30) || null,
    seller_address: input.seller_address?.trim().slice(0, 400) || null,
    client_name: input.client_name.trim().slice(0, 120),
    client_email: input.client_email?.trim().slice(0, 200) || null,
    client_phone: input.client_phone?.trim().slice(0, 40) || null,
    client_address: input.client_address?.trim().slice(0, 400) || null,
    line_items: items,
    currency: "INR",
    subtotal,
    gst_percent,
    gst_amount,
    total,
    notes: input.notes?.trim().slice(0, 1000) || null,
    payment_note:
      input.payment_note?.trim().slice(0, 500) ||
      "Pay the creator directly. ROLLR does not collect payment.",
    status: input.status || "draft",
  };

  const { data, error } = await supabase
    .from("invoices")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.warn("[rollr] createInvoice", error.message);
    return {
      error:
        error.message.includes("invoices") || error.message.includes("schema")
          ? "Invoices not set up — run migration 00017 in Supabase SQL Editor."
          : "Couldn’t create invoice. Try again.",
    };
  }
  return { invoice: rowToInvoice(data as Record<string, unknown>) };
}

export async function updateInvoiceStatus(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  status: InvoiceStatus
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_user_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function formatInvoiceMoney(n: number): string {
  return formatPriceInr(n);
}

export function publicInvoicePath(token: string): string {
  return `/i/${token}`;
}
