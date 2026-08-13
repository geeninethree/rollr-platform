import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchMyInvoices, type Invoice } from "@/lib/invoices";
import { fetchMyQuotes, type Quote } from "@/lib/quotes";
import { fetchMyBookings, type Booking } from "@/lib/bookings";
import { fetchMyDeliveryNotes, type DeliveryNote } from "@/lib/delivery-notes";
import { fetchMyInquiries } from "@/lib/inquiries";
import type { Inquiry } from "@/lib/types";
import { normaliseWhatsApp } from "@/lib/format";

export type ClientFolder = {
  key: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  briefs: Inquiry[];
  quotes: Quote[];
  bookings: Booking[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  totalInvoiced: number;
  totalPaid: number;
  lastActivity: string;
};

function clientKey(input: {
  phone?: string | null;
  email?: string | null;
  name: string;
}): string {
  const phone = input.phone ? normaliseWhatsApp(input.phone) : "";
  if (phone && phone.length >= 10) return `p:${phone}`;
  const email = (input.email || "").trim().toLowerCase();
  if (email) return `e:${email}`;
  return `n:${input.name.trim().toLowerCase()}`;
}

function maxDate(dates: string[]): string {
  return dates.filter(Boolean).sort().reverse()[0] || "";
}

export async function fetchClientFolders(
  supabase: SupabaseClient,
  userId: string
): Promise<{ folders: ClientFolder[]; error?: string }> {
  const [inv, quotes, bookings, notes, briefs] = await Promise.all([
    fetchMyInvoices(supabase, userId),
    fetchMyQuotes(supabase, userId),
    fetchMyBookings(supabase, userId),
    fetchMyDeliveryNotes(supabase, userId),
    fetchMyInquiries(supabase, userId),
  ]);

  const map = new Map<string, ClientFolder>();

  function ensure(input: {
    name: string;
    phone?: string | null;
    email?: string | null;
  }): ClientFolder {
    const key = clientKey(input);
    let f = map.get(key);
    if (!f) {
      f = {
        key,
        name: input.name || "Client",
        phone: input.phone || null,
        email: input.email || null,
        briefs: [],
        quotes: [],
        bookings: [],
        invoices: [],
        deliveryNotes: [],
        totalInvoiced: 0,
        totalPaid: 0,
        lastActivity: "",
      };
      map.set(key, f);
    } else {
      if (!f.phone && input.phone) f.phone = input.phone;
      if (!f.email && input.email) f.email = input.email;
      if (input.name && input.name.length > f.name.length) f.name = input.name;
    }
    return f;
  }

  for (const i of inv.invoices) {
    const f = ensure({
      name: i.client_name,
      phone: i.client_phone,
      email: i.client_email,
    });
    f.invoices.push(i);
    f.totalInvoiced += Number(i.total) || 0;
    if (i.status === "paid") f.totalPaid += Number(i.total) || 0;
  }
  for (const q of quotes.quotes) {
    const f = ensure({
      name: q.client_name,
      phone: q.client_phone,
      email: q.client_email,
    });
    f.quotes.push(q);
  }
  for (const b of bookings.bookings) {
    const f = ensure({
      name: b.client_name,
      phone: b.client_phone,
      email: b.client_email,
    });
    f.bookings.push(b);
  }
  for (const n of notes.notes) {
    const f = ensure({
      name: n.client_name,
      phone: n.client_phone,
      email: n.client_email,
    });
    f.deliveryNotes.push(n);
  }
  for (const br of briefs.items) {
    const f = ensure({
      name: br.client_name,
      phone: br.client_whatsapp,
      email: br.client_email,
    });
    f.briefs.push(br);
  }

  const folders = Array.from(map.values()).map((f) => {
    f.lastActivity = maxDate([
      ...f.invoices.map((x) => x.created_at),
      ...f.quotes.map((x) => x.created_at),
      ...f.bookings.map((x) => x.created_at),
      ...f.deliveryNotes.map((x) => x.created_at),
      ...f.briefs.map((x) => x.created_at),
    ]);
    return f;
  });

  folders.sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || ""));

  const err =
    inv.error || quotes.error || bookings.error || notes.error || briefs.error;
  return { folders, error: err };
}

export type EarningsSummary = {
  year: number;
  invoiceCount: number;
  paidCount: number;
  draftOrSentCount: number;
  totalInvoiced: number;
  totalPaid: number;
  totalGstOnPaid: number;
  byMonth: { month: number; paid: number; count: number }[];
};

export function summarizeEarnings(
  invoices: Invoice[],
  year: number
): EarningsSummary {
  const inYear = invoices.filter((i) => {
    const y = new Date(i.issue_date || i.created_at).getFullYear();
    return y === year && i.status !== "void";
  });
  const paid = inYear.filter((i) => i.status === "paid");
  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    paid: 0,
    count: 0,
  }));
  for (const inv of paid) {
    const m = new Date(inv.issue_date || inv.created_at).getMonth();
    byMonth[m].paid += Number(inv.total) || 0;
    byMonth[m].count += 1;
  }
  return {
    year,
    invoiceCount: inYear.length,
    paidCount: paid.length,
    draftOrSentCount: inYear.filter(
      (i) => i.status === "draft" || i.status === "sent"
    ).length,
    totalInvoiced: inYear.reduce((s, i) => s + (Number(i.total) || 0), 0),
    totalPaid: paid.reduce((s, i) => s + (Number(i.total) || 0), 0),
    totalGstOnPaid: paid.reduce((s, i) => s + (Number(i.gst_amount) || 0), 0),
    byMonth,
  };
}

export function earningsToCsv(invoices: Invoice[], year: number): string {
  const rows = invoices.filter((i) => {
    const y = new Date(i.issue_date || i.created_at).getFullYear();
    return y === year && i.status !== "void";
  });
  const header = [
    "invoice_number",
    "issue_date",
    "client_name",
    "status",
    "subtotal",
    "gst_percent",
    "gst_amount",
    "total",
  ].join(",");
  const lines = rows.map((i) =>
    [
      i.invoice_number,
      i.issue_date,
      `"${(i.client_name || "").replace(/"/g, '""')}"`,
      i.status,
      i.subtotal,
      i.gst_percent,
      i.gst_amount,
      i.total,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}
