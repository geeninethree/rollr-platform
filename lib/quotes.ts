import type { SupabaseClient } from "@supabase/supabase-js";
import type { Inquiry } from "@/lib/types";
import {
  computeMoneyTotals,
  docNumber,
  formatDocMoney,
  isSchemaError,
  migrationHint,
  type MoneyLineItem,
} from "@/lib/doc-money";
import {
  packagesToQuoteLineItems,
  type PricingPackage,
} from "@/lib/pricing";

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "void";

export type Quote = {
  id: string;
  creator_user_id: string;
  inquiry_id?: string | null;
  quote_number: string;
  issue_date: string;
  valid_until?: string | null;
  seller_name: string;
  seller_email?: string | null;
  seller_phone?: string | null;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  line_items: MoneyLineItem[];
  currency: string;
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  total: number;
  notes?: string | null;
  status: QuoteStatus;
  public_token: string;
  created_at: string;
  updated_at: string;
};

export type CreateQuoteInput = {
  inquiry_id?: string | null;
  seller_name: string;
  seller_email?: string;
  seller_phone?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  line_items: MoneyLineItem[];
  gst_percent?: number;
  notes?: string;
  valid_until?: string;
  status?: QuoteStatus;
};

function rowToQuote(row: Record<string, unknown>): Quote {
  const items = Array.isArray(row.line_items)
    ? (row.line_items as MoneyLineItem[])
    : [];
  return {
    id: String(row.id),
    creator_user_id: String(row.creator_user_id),
    inquiry_id: row.inquiry_id ? String(row.inquiry_id) : null,
    quote_number: String(row.quote_number || ""),
    issue_date: String(row.issue_date || ""),
    valid_until: row.valid_until ? String(row.valid_until) : null,
    seller_name: String(row.seller_name || ""),
    seller_email: (row.seller_email as string) || null,
    seller_phone: (row.seller_phone as string) || null,
    client_name: String(row.client_name || ""),
    client_email: (row.client_email as string) || null,
    client_phone: (row.client_phone as string) || null,
    line_items: items,
    currency: String(row.currency || "INR"),
    subtotal: Number(row.subtotal || 0),
    gst_percent: Number(row.gst_percent || 0),
    gst_amount: Number(row.gst_amount || 0),
    total: Number(row.total || 0),
    notes: (row.notes as string) || null,
    status: (row.status as QuoteStatus) || "draft",
    public_token: String(row.public_token || ""),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

/** Prefill line items from listing packages (studio pricing). */
export function draftQuoteFromPackages(
  packages: PricingPackage[],
  seller: { name: string; email?: string; phone?: string },
  client?: { name?: string; email?: string; phone?: string }
): CreateQuoteInput {
  const line_items = packagesToQuoteLineItems(packages);
  const valid = new Date();
  valid.setDate(valid.getDate() + 14);
  return {
    seller_name: seller.name,
    seller_email: seller.email,
    seller_phone: seller.phone,
    client_name: client?.name || "",
    client_email: client?.email,
    client_phone: client?.phone,
    line_items,
    gst_percent: 0,
    notes: "From listing packages",
    valid_until: valid.toISOString().slice(0, 10),
    status: "draft",
  };
}

export function draftQuoteFromInquiry(
  inquiry: Inquiry,
  seller: { name: string; email?: string; phone?: string }
): CreateQuoteInput {
  const amount =
    Number(String(inquiry.budget || "").replace(/[^\d.]/g, "")) || 0;
  const valid = new Date();
  valid.setDate(valid.getDate() + 14);
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
          inquiry.category,
          inquiry.location,
          inquiry.event_date,
        ]
          .filter(Boolean)
          .join(" · ") || "Creative services",
        quantity: 1,
        unit_amount: amount > 0 ? amount : 0,
      },
    ],
    gst_percent: 0,
    notes: inquiry.message
      ? `Brief: ${inquiry.message.slice(0, 200)}`
      : undefined,
    valid_until: valid.toISOString().slice(0, 10),
    status: "draft",
  };
}

export async function fetchMyQuotes(
  supabase: SupabaseClient,
  userId: string
): Promise<{ quotes: Quote[]; error?: string }> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[rollr] fetchMyQuotes", error.message);
    return {
      quotes: [],
      error: isSchemaError(error.message)
        ? migrationHint("Quotes")
        : "Couldn’t load quotes.",
    };
  }
  return {
    quotes: (data || []).map((r) => rowToQuote(r as Record<string, unknown>)),
  };
}

export async function fetchQuoteByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ quote?: Quote; error?: string }> {
  const { data, error } = await supabase.rpc("get_quote_by_token", {
    p_token: token.trim(),
  });
  if (error) return { error: "Quote not found." };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Quote not found." };
  return { quote: rowToQuote(row as Record<string, unknown>) };
}

export async function fetchQuoteById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<{ quote?: Quote; error?: string }> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("creator_user_id", userId)
    .maybeSingle();
  if (error || !data) return { error: "Quote not found." };
  return { quote: rowToQuote(data as Record<string, unknown>) };
}

export async function createQuote(
  supabase: SupabaseClient,
  userId: string,
  input: CreateQuoteInput
): Promise<{ quote?: Quote; error?: string }> {
  const items = (input.line_items || [])
    .map((li) => ({
      description: (li.description || "").trim().slice(0, 300),
      quantity: Math.max(0, Number(li.quantity) || 0),
      unit_amount: Math.max(0, Number(li.unit_amount) || 0),
    }))
    .filter((li) => li.description);

  if (items.length === 0) return { error: "Add at least one line item." };
  if (!input.seller_name.trim() || !input.client_name.trim()) {
    return { error: "Seller and client names are required." };
  }

  const gst_percent = Math.max(0, Math.min(100, Number(input.gst_percent) || 0));
  const { subtotal, gst_amount, total } = computeMoneyTotals(items, gst_percent);

  const payload = {
    creator_user_id: userId,
    inquiry_id: input.inquiry_id || null,
    quote_number: docNumber("QTE"),
    issue_date: new Date().toISOString().slice(0, 10),
    valid_until: input.valid_until || null,
    seller_name: input.seller_name.trim().slice(0, 120),
    seller_email: input.seller_email?.trim().slice(0, 200) || null,
    seller_phone: input.seller_phone?.trim().slice(0, 40) || null,
    client_name: input.client_name.trim().slice(0, 120),
    client_email: input.client_email?.trim().slice(0, 200) || null,
    client_phone: input.client_phone?.trim().slice(0, 40) || null,
    line_items: items,
    currency: "INR",
    subtotal,
    gst_percent,
    gst_amount,
    total,
    notes: input.notes?.trim().slice(0, 1000) || null,
    status: input.status || "draft",
  };

  const { data, error } = await supabase
    .from("quotes")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.warn("[rollr] createQuote", error.message);
    return {
      error: isSchemaError(error.message)
        ? migrationHint("Quotes")
        : "Couldn’t create quote.",
    };
  }
  return { quote: rowToQuote(data as Record<string, unknown>) };
}

export async function updateQuoteStatus(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  status: QuoteStatus
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function publicQuotePath(token: string) {
  return `/q/${token}`;
}

export { formatDocMoney as formatQuoteMoney, computeMoneyTotals };
