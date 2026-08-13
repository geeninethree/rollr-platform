import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNextPath } from "@/lib/user-messages";

/**
 * Production-safe origin for redirects (Vercel proxy-aware).
 * Prefer NEXT_PUBLIC_SITE_URL so email confirm never bounces to a wrong host.
 */
function redirectBase(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${proto}://${forwardedHost}`;

  return new URL(request.url).origin;
}

function loginErrorRedirect(base: string, next: string, message: string) {
  const url = new URL(`${base}/login`);
  url.searchParams.set("error", message);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url.toString());
}

/**
 * Email confirm / magic-link / OAuth callback.
 *
 * Critical: session cookies must be set on the *redirect response*.
 * Setting only via cookies() and then returning a new redirect drops the session
 * for many users (looks like “confirm did nothing”).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/");
  const base = redirectBase(request);

  const oauthError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");
  if (oauthError) {
    return loginErrorRedirect(
      base,
      next,
      oauthError.replace(/\+/g, " ")
    );
  }

  // No server-visible tokens → client page handles hash fragments / edge cases
  if (!code && !tokenHash) {
    const finish = new URL(`${base}/auth/confirm`);
    finish.searchParams.set("next", next);
    return NextResponse.redirect(finish.toString());
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return loginErrorRedirect(
      base,
      next,
      "Sign-in is temporarily unavailable. Please try again later."
    );
  }

  // Build success redirect first; attach auth cookies onto this same response
  const success = new URL(`${base}${next}`);
  success.searchParams.set("verified", "1");
  const response = NextResponse.redirect(success.toString());

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn("[rollr] auth callback code exchange:", error.message);
      return loginErrorRedirect(
        base,
        next,
        "Couldn’t complete sign-in. The link may have expired — request a new one."
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "signup"
        | "email"
        | "magiclink"
        | "invite"
        | "recovery"
        | "email_change",
    });
    if (error) {
      console.warn("[rollr] auth callback otp verify:", error.message);
      return loginErrorRedirect(
        base,
        next,
        "Couldn’t verify your email. Request a new confirmation link from the sign-in page."
      );
    }
  }

  // Soft post-verify: ensure profile role from signup metadata
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const meta = user.user_metadata || {};
      const role = meta.role as string | undefined;
      const fullName = (meta.full_name as string | undefined)?.trim();
      if (role || fullName) {
        const patch: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (fullName) patch.full_name = fullName;
        if (
          role === "client" ||
          role === "creator" ||
          role === "recruiter"
        ) {
          patch.role = role;
        }
        await supabase.from("profiles").update(patch).eq("id", user.id);
      }
    }
  } catch (e) {
    console.warn("[rollr] post-verify profile bootstrap soft-fail", e);
  }

  return response;
}
