import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/supabase/health
 * Public: only { ok }. Detailed diagnostics require ?detail=1 in development
 * or HEALTH_SECRET header matching HEALTH_CHECK_SECRET.
 */
export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const wantDetail =
    process.env.NODE_ENV !== "production" ||
    (process.env.HEALTH_CHECK_SECRET &&
      req.headers.get("x-health-secret") === process.env.HEALTH_CHECK_SECRET);

  if (!url || !anonKey) {
    return NextResponse.json(
      wantDetail
        ? { ok: false, configured: false, message: "Missing Supabase env" }
        : { ok: false },
      { status: 503 }
    );
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase
      .from("creator_profiles")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        wantDetail
          ? {
              ok: false,
              configured: true,
              message: "Database unreachable or schema incomplete",
            }
          : { ok: false },
        { status: 503 }
      );
    }

    return NextResponse.json(
      wantDetail
        ? { ok: true, configured: true, message: "Connected" }
        : { ok: true }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
