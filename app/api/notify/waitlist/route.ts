import { NextResponse } from "next/server";
import {
  getNotifyAdminEmails,
  sendEmail,
  waitlistAdminEmail,
} from "@/lib/email";

type Body = {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  primary_category?: string;
  notes?: string;
};

/**
 * POST after waitlist insert — emails admin allowlist (if Resend configured).
 * Does NOT email the waitlist user (alpha: review in /admin, invite manually).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const fullName = body.full_name?.trim();
    const email = body.email?.trim();
    if (!fullName || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email required" },
        { status: 400 }
      );
    }

    const admins = getNotifyAdminEmails();
    if (admins.length === 0) {
      console.info(
        "[waitlist-notify] No ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAILS — skipped"
      );
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_admin_emails",
      });
    }

    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://rollr-platform-gig.vercel.app";

    const mail = waitlistAdminEmail({
      fullName,
      email,
      phone: body.phone?.trim() || undefined,
      role: body.role?.trim() || "unknown",
      primaryCategory: body.primary_category?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
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
