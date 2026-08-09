import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/supabase/health
 * Checks that env is set and Supabase is reachable (anon key).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Lightweight call: list tables via a simple select (empty table is fine)
    const { error } = await supabase
      .from("creator_profiles")
      .select("id")
      .limit(1);

    if (error) {
      // Relation missing often means migration not run yet
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          urlHost: safeHost(url),
          message: error.message,
          hint:
            error.message.includes("schema cache") ||
            error.code === "42P01" ||
            error.message.toLowerCase().includes("does not exist")
              ? "Run supabase/migrations/00001_init.sql and 00002_rls_and_profile_trigger.sql in the SQL Editor."
              : "Check API keys and that the project is not paused.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      urlHost: safeHost(url),
      message: "Supabase connected. creator_profiles is readable.",
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}
