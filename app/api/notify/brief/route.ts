import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  briefNotifyEmail,
  getNotifyAdminEmails,
  sendEmail,
} from "@/lib/email";

type NotifyBody = {
  creator_id: string;
  creator_name: string;
  client_name: string;
  category?: string;
  location?: string;
  event_date?: string;
  message: string;
};

/**
 * POST notify payload (from client after brief insert).
 * Resolves creator email via security definer RPC; sends via Resend if configured.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NotifyBody;
    if (!body.creator_id || !body.client_name || !body.message) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { ok: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key);
    const { data: emailRpc, error: rpcError } = await supabase.rpc(
      "creator_notify_email",
      { p_creator_id: body.creator_id }
    );

    if (rpcError) {
      return NextResponse.json({
        ok: false,
        error: `${rpcError.message} — run migration 00008`,
      });
    }

    const to = (emailRpc as string | null) || null;
    if (!to) {
      return NextResponse.json({
        ok: false,
        error: "Creator email not found",
      });
    }

    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://rollrgigs.vercel.app";
    const mail = briefNotifyEmail({
      creatorName: body.creator_name,
      clientName: body.client_name,
      category: body.category || "Brief",
      location: body.location || "Mumbai",
      eventDate: body.event_date || undefined,
      message: body.message,
      inboxUrl: `${site}/inbox`,
    });

    const result = await sendEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    // Ops backup: if Resend works, also ping admin so you can nudge creators who miss inbox
    const admins = getNotifyAdminEmails().filter(
      (a) => a.toLowerCase() !== to.toLowerCase()
    );
    if (admins.length > 0 && !result.skipped) {
      void sendEmail({
        to: admins,
        subject: `[ROLLR] Brief for ${body.creator_name}: ${body.client_name}`,
        text: [
          `New brief on ROLLR`,
          `Creator: ${body.creator_name} (${to})`,
          `Client: ${body.client_name}`,
          `${body.category || "Brief"} · ${body.location || "Mumbai"}`,
          ``,
          body.message,
          ``,
          `Creator inbox: ${site}/inbox`,
        ].join("\n"),
        html: `<p>New brief for <strong>${body.creator_name}</strong> (${to}).</p><p>Client: ${body.client_name}</p><p>${body.message}</p><p><a href="${site}/inbox">Creator inbox</a></p>`,
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
