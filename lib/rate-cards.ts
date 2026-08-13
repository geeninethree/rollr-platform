import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatDocMoney,
  isSchemaError,
  migrationHint,
} from "@/lib/doc-money";

export type RatePackage = {
  name: string;
  description: string;
  price: number;
  unit?: string;
};

export type RateCardStatus = "draft" | "active" | "archived";

export type RateCard = {
  id: string;
  creator_user_id: string;
  title: string;
  creator_name: string;
  creator_tagline?: string | null;
  creator_email?: string | null;
  creator_phone?: string | null;
  packages: RatePackage[];
  notes?: string | null;
  currency: string;
  status: RateCardStatus;
  public_token: string;
  created_at: string;
  updated_at: string;
};

export type CreateRateCardInput = {
  title?: string;
  creator_name: string;
  creator_tagline?: string;
  creator_email?: string;
  creator_phone?: string;
  packages: RatePackage[];
  notes?: string;
  status?: RateCardStatus;
};

function rowToRateCard(row: Record<string, unknown>): RateCard {
  const packages = Array.isArray(row.packages)
    ? (row.packages as RatePackage[])
    : [];
  return {
    id: String(row.id),
    creator_user_id: String(row.creator_user_id),
    title: String(row.title || "Rate card"),
    creator_name: String(row.creator_name || ""),
    creator_tagline: (row.creator_tagline as string) || null,
    creator_email: (row.creator_email as string) || null,
    creator_phone: (row.creator_phone as string) || null,
    packages,
    notes: (row.notes as string) || null,
    currency: String(row.currency || "INR"),
    status: (row.status as RateCardStatus) || "active",
    public_token: String(row.public_token || ""),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export async function fetchMyRateCards(
  supabase: SupabaseClient,
  userId: string
): Promise<{ cards: RateCard[]; error?: string }> {
  const { data, error } = await supabase
    .from("rate_cards")
    .select("*")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[rollr] fetchMyRateCards", error.message);
    return {
      cards: [],
      error: isSchemaError(error.message)
        ? migrationHint("Rate cards")
        : "Couldn’t load rate cards.",
    };
  }
  return {
    cards: (data || []).map((r) =>
      rowToRateCard(r as Record<string, unknown>)
    ),
  };
}

export async function fetchRateCardByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ card?: RateCard; error?: string }> {
  const { data, error } = await supabase.rpc("get_rate_card_by_token", {
    p_token: token.trim(),
  });
  if (error) return { error: "Rate card not found." };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Rate card not found." };
  return { card: rowToRateCard(row as Record<string, unknown>) };
}

export async function fetchRateCardById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<{ card?: RateCard; error?: string }> {
  const { data, error } = await supabase
    .from("rate_cards")
    .select("*")
    .eq("id", id)
    .eq("creator_user_id", userId)
    .maybeSingle();
  if (error || !data) return { error: "Rate card not found." };
  return { card: rowToRateCard(data as Record<string, unknown>) };
}

export async function createRateCard(
  supabase: SupabaseClient,
  userId: string,
  input: CreateRateCardInput
): Promise<{ card?: RateCard; error?: string }> {
  const packages = (input.packages || [])
    .map((p) => ({
      name: (p.name || "").trim().slice(0, 120),
      description: (p.description || "").trim().slice(0, 400),
      price: Math.max(0, Math.round(Number(p.price) || 0)),
      unit: (p.unit || "").trim().slice(0, 60) || undefined,
    }))
    .filter((p) => p.name);

  if (!input.creator_name.trim()) {
    return { error: "Your name is required." };
  }
  if (packages.length === 0) {
    return { error: "Add at least one package." };
  }

  const payload = {
    creator_user_id: userId,
    title: (input.title || "Rate card").trim().slice(0, 120),
    creator_name: input.creator_name.trim().slice(0, 120),
    creator_tagline: input.creator_tagline?.trim().slice(0, 200) || null,
    creator_email: input.creator_email?.trim().slice(0, 200) || null,
    creator_phone: input.creator_phone?.trim().slice(0, 40) || null,
    packages,
    notes: input.notes?.trim().slice(0, 1000) || null,
    currency: "INR",
    status: input.status || "active",
  };

  const { data, error } = await supabase
    .from("rate_cards")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.warn("[rollr] createRateCard", error.message);
    return {
      error: isSchemaError(error.message)
        ? migrationHint("Rate cards")
        : "Couldn’t create rate card.",
    };
  }
  return { card: rowToRateCard(data as Record<string, unknown>) };
}

export function publicRateCardPath(token: string) {
  return `/r/${token}`;
}

export { formatDocMoney as formatRateMoney };
