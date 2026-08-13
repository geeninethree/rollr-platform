import { NextResponse } from "next/server";
import {
  briefAdminCopyEmail,
  briefNotifyEmail,
  getNotifyAdminEmails,
  sendEmail,
} from "@/lib/email";
import {
  clientIp,
  getServiceSupabase,
  rateLimit,
} from "@/lib/server-supabase";

type NotifyBody = {
  creator_id: string;
  creator_name?: string;
  client_name: string;
  category?: string;
  location?: string;
  event_date?: string;
  message: string;
  inquiry_id?: string;
};

/**
 * POST after a successful brief insert.
 * Requires service role + a matching recent inquiry (no open email harvest).
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`notify-brief:${ip}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Try again shortly." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as NotifyBody;
    if (!body.creator_id || !body.client_name?.trim() || !body.message?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Notify not configured (missing SUPABASE_SERVICE_ROLE_KEY)",
          skipped: true,
        },
        { status: 503 }
      );
    }

    // Prove a real inquiry exists (anti-spam): same creator + client, last 15 min
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let q = supabase
      .from("inquiries")
      .select("id, creator_id, client_name, message, creator_name")
      .eq("creator_id", body.creator_id)
      .eq("client_name", body.client_name.trim())
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);

    if (body.inquiry_id) {
      q = supabase
        .from("inquiries")
        .select("id, creator_id, client_name, message, creator_name")
        .eq("id", body.inquiry_id)
        .eq("creator_id", body.creator_id)
        .limit(1);
    }

    const { data: inqRows, error: inqErr } = await q;
    if (inqErr || !inqRows?.length) {
      return NextResponse.json(
        { ok: false, error: "No matching brief found" },
        { status: 403 }
      );
    }

    const inq = inqRows[0] as {
      creator_name?: string;
      message?: string;
    };

    const { data: emailRpc, error: rpcError } = await supabase.rpc(
      "creator_notify_email",
      { p_creator_id: body.creator_id }
    );

    if (rpcError) {
      console.warn("[notify/brief] rpc", rpcError.message);
      return NextResponse.json(
        { ok: false, error: "Could not resolve creator contact" },
        { status: 500 }
      );
    }

    const to = (emailRpc as string | null) || null;
    if (!to) {
      return NextResponse.json({
        ok: false,
        error: "Creator email not found",
        skipped: true,
      });
    }

    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://rollrgigs.vercel.app";
    const creatorName =
      body.creator_name?.trim() || inq.creator_name || "Creator";
    const mail = briefNotifyEmail({
      creatorName,
      clientName: body.client_name.trim(),
      category: body.category || "Brief",
      location: body.location || "Mumbai",
      eventDate: body.event_date || undefined,
      message: (body.message || inq.message || "").slice(0, 4000),
      inboxUrl: `${site}/inbox`,
    });

    const result = await sendEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    const admins = getNotifyAdminEmails().filter(
      (a) => a.toLowerCase() !== to.toLowerCase()
    );
    if (admins.length > 0 && !result.skipped) {
      const adminMail = briefAdminCopyEmail({
        creatorName,
        creatorEmail: to,
        clientName: body.client_name.trim(),
        category: body.category || "Brief",
        location: body.location || "Mumbai",
        message: (body.message || "").slice(0, 4000),
        inboxUrl: `${site}/inbox`,
      });
      void sendEmail({
        to: admins,
        subject: adminMail.subject,
        html: adminMail.html,
        text: adminMail.text,
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Notify failed",
      },
      { status: 500 }
    );
  }
}
