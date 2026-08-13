import type { SupabaseClient } from "@supabase/supabase-js";
import type { Inquiry } from "@/lib/types";
import {
  docNumber,
  isSchemaError,
  migrationHint,
} from "@/lib/doc-money";

export type DeliveryItem = {
  description: string;
  quantity: number;
  notes?: string;
};

export type DeliveryNoteStatus = "draft" | "sent";

export type DeliveryNote = {
  id: string;
  creator_user_id: string;
  inquiry_id?: string | null;
  note_number: string;
  issue_date: string;
  creator_name: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  project_title: string;
  delivery_date?: string | null;
  items: DeliveryItem[];
  access_note?: string | null;
  notes?: string | null;
  status: DeliveryNoteStatus;
  public_token: string;
  created_at: string;
  updated_at: string;
};

export type CreateDeliveryNoteInput = {
  inquiry_id?: string | null;
  creator_name: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  project_title: string;
  delivery_date?: string;
  items: DeliveryItem[];
  access_note?: string;
  notes?: string;
  status?: DeliveryNoteStatus;
};

function rowToNote(row: Record<string, unknown>): DeliveryNote {
  const items = Array.isArray(row.items) ? (row.items as DeliveryItem[]) : [];
  return {
    id: String(row.id),
    creator_user_id: String(row.creator_user_id),
    inquiry_id: row.inquiry_id ? String(row.inquiry_id) : null,
    note_number: String(row.note_number || ""),
    issue_date: String(row.issue_date || ""),
    creator_name: String(row.creator_name || ""),
    client_name: String(row.client_name || ""),
    client_email: (row.client_email as string) || null,
    client_phone: (row.client_phone as string) || null,
    project_title: String(row.project_title || ""),
    delivery_date: row.delivery_date ? String(row.delivery_date) : null,
    items,
    access_note: (row.access_note as string) || null,
    notes: (row.notes as string) || null,
    status: (row.status as DeliveryNoteStatus) || "draft",
    public_token: String(row.public_token || ""),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export function draftDeliveryFromInquiry(
  inquiry: Inquiry,
  creatorName: string
): CreateDeliveryNoteInput {
  return {
    inquiry_id: inquiry.id.startsWith("inq_") ? null : inquiry.id,
    creator_name: creatorName,
    client_name: inquiry.client_name,
    client_email: inquiry.client_email,
    client_phone: inquiry.client_whatsapp,
    project_title:
      [inquiry.category, inquiry.location].filter(Boolean).join(" · ") ||
      "Project delivery",
    delivery_date: new Date().toISOString().slice(0, 10),
    items: [
      { description: "Final selects / edits", quantity: 1 },
      { description: "Raw / additional files (if agreed)", quantity: 1 },
    ],
    status: "draft",
  };
}

export async function fetchMyDeliveryNotes(
  supabase: SupabaseClient,
  userId: string
): Promise<{ notes: DeliveryNote[]; error?: string }> {
  const { data, error } = await supabase
    .from("delivery_notes")
    .select("*")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[rollr] fetchMyDeliveryNotes", error.message);
    return {
      notes: [],
      error: isSchemaError(error.message)
        ? migrationHint("Delivery notes")
        : "Couldn’t load delivery notes.",
    };
  }
  return {
    notes: (data || []).map((r) => rowToNote(r as Record<string, unknown>)),
  };
}

export async function fetchDeliveryNoteByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ note?: DeliveryNote; error?: string }> {
  const { data, error } = await supabase.rpc("get_delivery_note_by_token", {
    p_token: token.trim(),
  });
  if (error) return { error: "Delivery note not found." };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Delivery note not found." };
  return { note: rowToNote(row as Record<string, unknown>) };
}

export async function fetchDeliveryNoteById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<{ note?: DeliveryNote; error?: string }> {
  const { data, error } = await supabase
    .from("delivery_notes")
    .select("*")
    .eq("id", id)
    .eq("creator_user_id", userId)
    .maybeSingle();
  if (error || !data) return { error: "Delivery note not found." };
  return { note: rowToNote(data as Record<string, unknown>) };
}

export async function createDeliveryNote(
  supabase: SupabaseClient,
  userId: string,
  input: CreateDeliveryNoteInput
): Promise<{ note?: DeliveryNote; error?: string }> {
  const items = (input.items || [])
    .map((it) => ({
      description: (it.description || "").trim().slice(0, 300),
      quantity: Math.max(0, Number(it.quantity) || 0),
      notes: it.notes?.trim().slice(0, 200) || undefined,
    }))
    .filter((it) => it.description);

  if (!input.creator_name.trim() || !input.client_name.trim()) {
    return { error: "Creator and client names are required." };
  }
  if (!input.project_title.trim()) {
    return { error: "Project title is required." };
  }
  if (items.length === 0) return { error: "Add at least one delivered item." };

  const payload = {
    creator_user_id: userId,
    inquiry_id: input.inquiry_id || null,
    note_number: docNumber("DLV"),
    issue_date: new Date().toISOString().slice(0, 10),
    creator_name: input.creator_name.trim().slice(0, 120),
    client_name: input.client_name.trim().slice(0, 120),
    client_email: input.client_email?.trim().slice(0, 200) || null,
    client_phone: input.client_phone?.trim().slice(0, 40) || null,
    project_title: input.project_title.trim().slice(0, 200),
    delivery_date: input.delivery_date || null,
    items,
    access_note: input.access_note?.trim().slice(0, 500) || null,
    notes: input.notes?.trim().slice(0, 1000) || null,
    status: input.status || "draft",
  };

  const { data, error } = await supabase
    .from("delivery_notes")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.warn("[rollr] createDeliveryNote", error.message);
    return {
      error: isSchemaError(error.message)
        ? migrationHint("Delivery notes")
        : "Couldn’t create delivery note.",
    };
  }
  return { note: rowToNote(data as Record<string, unknown>) };
}

export function publicDeliveryPath(token: string) {
  return `/d/${token}`;
}
