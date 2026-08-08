import type { Inquiry, InquiryStatus, SendBriefInput } from "@/lib/types";

const STORAGE_KEY = "rollr_inquiries_v1";
export const INQUIRIES_CHANGED = "rollr:inquiries-changed";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readAll(): Inquiry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Inquiry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: Inquiry[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(INQUIRIES_CHANGED));
}

function uid() {
  return `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listInquiries(): Inquiry[] {
  return readAll().sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function listInquiriesForCreator(creatorId: string): Inquiry[] {
  return listInquiries().filter((i) => i.creator_id === creatorId);
}

export function getInquiry(id: string): Inquiry | null {
  return readAll().find((i) => i.id === id) ?? null;
}

export function createInquiry(input: SendBriefInput): Inquiry {
  const now = new Date().toISOString();
  const inquiry: Inquiry = {
    id: uid(),
    creator_id: input.creator_id,
    creator_name: input.creator_name,
    client_name: input.client_name.trim(),
    client_whatsapp: input.client_whatsapp.trim(),
    client_email: input.client_email?.trim() || undefined,
    brief_type: input.brief_type,
    event_date: input.event_date,
    location: input.location.trim(),
    category: input.category,
    budget: input.budget?.trim() || undefined,
    message: input.message.trim(),
    status: "pending",
    created_at: now,
    updated_at: now,
  };
  const all = readAll();
  all.unshift(inquiry);
  writeAll(all);
  return inquiry;
}

export function setInquiryStatus(
  id: string,
  status: Exclude<InquiryStatus, "pending">
): Inquiry | null {
  const all = readAll();
  const idx = all.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const updated: Inquiry = {
    ...all[idx],
    status,
    updated_at: new Date().toISOString(),
  };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function countPending(): number {
  return readAll().filter((i) => i.status === "pending").length;
}
