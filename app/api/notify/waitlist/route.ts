import { NextResponse } from "next/server";
import {
  getNotifyAdminEmails,
  sendEmail,
  waitlistAdminEmail,
} from "@/lib/email";
import { clientIp, getServiceSupabase, rateLimit } from "@/lib/server-supabase";

type Body = {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  primary_category?: string;
  notes?: string;
};

/**
 * POST after waitlist insert — emails admins only.
 * Rate-limited; verifies a recent matching waitlist row when service role is set.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`notify-waitlist:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Body;
    const fullName = body.full_name?.trim().slice(0, 120);
    const email = body.email?.trim().toLowerCase().slice(0, 200);
    if (!fullName || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email required" },
        { status: 400 }
      );
    }

    const service = getServiceSupabase();
    if (service) {
      const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data } = await service
        .from("waitlist_signups")
        .select("id")
        .ilike("email", email)
        .gte("created_at", since)
        .limit(1);
      if (!data?.length) {
        return NextResponse.json(
          { ok: false, error: "No matching waitlist signup" },
          { status: 403 }
        );
      }
    }

    const admins = getNotifyAdminEmails();
    if (admins.length === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_admin_emails",
      });
    }

    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://rollrgigs.vercel.app";

    const mail = waitlistAdminEmail({
      fullName,
      email,
      phone: body.phone?.trim().slice(0, 40) || undefined,
      role: body.role?.trim().slice(0, 40) || "unknown",
      primaryCategory: body.primary_category?.trim().slice(0, 80) || undefined,
      notes: body.notes?.trim().slice(0, 1000) || undefined,
      adminUrl: `${site}/admin`,
    });

    const result = await sendEmail({
      to: admins,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Waitlist notify failed",
      },
      { status: 500 }
    );
  }
}
