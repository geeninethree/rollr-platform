import type { SupabaseClient } from "@supabase/supabase-js";
import type { Inquiry } from "@/lib/types";
import {
  docNumber,
  formatDocMoney,
  isSchemaError,
  migrationHint,
} from "@/lib/doc-money";

export type BookingStatus = "draft" | "sent" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  creator_user_id: string;
  inquiry_id?: string | null;
  booking_number: string;
  issue_date: string;
  creator_name: string;
  creator_email?: string | null;
  creator_phone?: string | null;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  location?: string | null;
  package_title: string;
  package_description?: string | null;
  deposit_amount: number;
  total_amount: number;
  currency: string;
  terms?: string | null;
  notes?: string | null;
  status: BookingStatus;
  public_token: string;
  created_at: string;
  updated_at: string;
};

export type CreateBookingInput = {
  inquiry_id?: string | null;
  creator_name: string;
  creator_email?: string;
  creator_phone?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  package_title: string;
  package_description?: string;
  deposit_amount?: number;
  total_amount?: number;
  terms?: string;
  notes?: string;
  status?: BookingStatus;
};

const DEFAULT_TERMS = `1. Deposit confirms the date; balance due as agreed.
2. Overtime, travel outside Mumbai city, and extra deliverables billed separately.
3. Cancellation: deposit may be non-refundable if within 7 days of the event.
4. Creator retains copyright; client receives usage rights for agreed deliverables.
5. ROLLR is a directory only — not a party to this booking.`;

function rowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    creator_user_id: String(row.creator_user_id),
    inquiry_id: row.inquiry_id ? String(row.inquiry_id) : null,
    booking_number: String(row.booking_number || ""),
    issue_date: String(row.issue_date || ""),
    creator_name: String(row.creator_name || ""),
    creator_email: (row.creator_email as string) || null,
    creator_phone: (row.creator_phone as string) || null,
    client_name: String(row.client_name || ""),
    client_email: (row.client_email as string) || null,
    client_phone: (row.client_phone as string) || null,
    event_date: row.event_date ? String(row.event_date) : null,
    event_time: (row.event_time as string) || null,
    location: (row.location as string) || null,
    package_title: String(row.package_title || ""),
    package_description: (row.package_description as string) || null,
    deposit_amount: Number(row.deposit_amount || 0),
    total_amount: Number(row.total_amount || 0),
    currency: String(row.currency || "INR"),
    terms: (row.terms as string) || null,
    notes: (row.notes as string) || null,
    status: (row.status as BookingStatus) || "draft",
    public_token: String(row.public_token || ""),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export function draftBookingFromInquiry(
  inquiry: Inquiry,
  creator: { name: string; email?: string; phone?: string }
): CreateBookingInput {
  const amount =
    Number(String(inquiry.budget || "").replace(/[^\d.]/g, "")) || 0;
  return {
    inquiry_id: inquiry.id.startsWith("inq_") ? null : inquiry.id,
    creator_name: creator.name,
    creator_email: creator.email,
    creator_phone: creator.phone,
    client_name: inquiry.client_name,
    client_email: inquiry.client_email,
    client_phone: inquiry.client_whatsapp,
    event_date: inquiry.event_date || undefined,
    location: inquiry.location || undefined,
    package_title:
      [inquiry.category, inquiry.brief_type.replace("_", " ")].join(" · ") ||
      "Creative package",
    package_description: inquiry.message?.slice(0, 400),
    deposit_amount: amount > 0 ? Math.round(amount * 0.3) : 0,
    total_amount: amount,
    terms: DEFAULT_TERMS,
    status: "draft",
  };
}

export async function fetchMyBookings(
  supabase: SupabaseClient,
  userId: string
): Promise<{ bookings: Booking[]; error?: string }> {
  const { data, error } = await supabase
    .from("booking_confirmations")
    .select("*")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[rollr] fetchMyBookings", error.message);
    return {
      bookings: [],
      error: isSchemaError(error.message)
        ? migrationHint("Bookings")
        : "Couldn’t load bookings.",
    };
  }
  return {
    bookings: (data || []).map((r) =>
      rowToBooking(r as Record<string, unknown>)
    ),
  };
}

export async function fetchBookingByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ booking?: Booking; error?: string }> {
  const { data, error } = await supabase.rpc("get_booking_by_token", {
    p_token: token.trim(),
  });
  if (error) return { error: "Booking not found." };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Booking not found." };
  return { booking: rowToBooking(row as Record<string, unknown>) };
}

export async function fetchBookingById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<{ booking?: Booking; error?: string }> {
  const { data, error } = await supabase
    .from("booking_confirmations")
    .select("*")
    .eq("id", id)
    .eq("creator_user_id", userId)
    .maybeSingle();
  if (error || !data) return { error: "Booking not found." };
  return { booking: rowToBooking(data as Record<string, unknown>) };
}

export async function createBooking(
  supabase: SupabaseClient,
  userId: string,
  input: CreateBookingInput
): Promise<{ booking?: Booking; error?: string }> {
  if (!input.creator_name.trim() || !input.client_name.trim()) {
    return { error: "Creator and client names are required." };
  }
  if (!input.package_title.trim()) {
    return { error: "Package title is required." };
  }

  const payload = {
    creator_user_id: userId,
    inquiry_id: input.inquiry_id || null,
    booking_number: docNumber("BKG"),
    issue_date: new Date().toISOString().slice(0, 10),
    creator_name: input.creator_name.trim().slice(0, 120),
    creator_email: input.creator_email?.trim().slice(0, 200) || null,
    creator_phone: input.creator_phone?.trim().slice(0, 40) || null,
    client_name: input.client_name.trim().slice(0, 120),
    client_email: input.client_email?.trim().slice(0, 200) || null,
    client_phone: input.client_phone?.trim().slice(0, 40) || null,
    event_date: input.event_date || null,
    event_time: input.event_time?.trim().slice(0, 40) || null,
    location: input.location?.trim().slice(0, 200) || null,
    package_title: input.package_title.trim().slice(0, 200),
    package_description: input.package_description?.trim().slice(0, 1000) || null,
    deposit_amount: Math.max(0, Math.round(Number(input.deposit_amount) || 0)),
    total_amount: Math.max(0, Math.round(Number(input.total_amount) || 0)),
    currency: "INR",
    terms: (input.terms || DEFAULT_TERMS).trim().slice(0, 4000),
    notes: input.notes?.trim().slice(0, 1000) || null,
    status: input.status || "draft",
  };

  const { data, error } = await supabase
    .from("booking_confirmations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.warn("[rollr] createBooking", error.message);
    return {
      error: isSchemaError(error.message)
        ? migrationHint("Bookings")
        : "Couldn’t create booking.",
    };
  }
  return { booking: rowToBooking(data as Record<string, unknown>) };
}

export async function updateBookingStatus(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  status: BookingStatus
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("booking_confirmations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function publicBookingPath(token: string) {
  return `/b/${token}`;
}

export { formatDocMoney as formatBookingMoney, DEFAULT_TERMS };
