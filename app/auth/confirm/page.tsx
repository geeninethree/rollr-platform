"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { humanizeAuthError, safeNextPath } from "@/lib/user-messages";

/**
 * Client-side auth finish page.
 * Handles:
 * - ?code= (PKCE) via exchangeCodeForSession
 * - ?token_hash=&type= via verifyOtp
 * - #access_token= (legacy / implicit) via getSession detectSessionInUrl
 *
 * Used when server callback has no query tokens, or as emailRedirectTo target.
 */
function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const next = safeNextPath(searchParams.get("next"), "/");
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) {
          setStatus("error");
          setError("Sign-in is temporarily unavailable.");
        }
        return;
      }

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const oauthError =
          searchParams.get("error_description") || searchParams.get("error");

        if (oauthError) {
          throw new Error(oauthError.replace(/\+/g, " "));
        }

        if (code) {
          const { error: exErr } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else if (tokenHash && type) {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as
              | "signup"
              | "email"
              | "magiclink"
              | "invite"
              | "recovery"
              | "email_change",
          });
          if (otpErr) throw otpErr;
        } else {
          // Legacy hash tokens: createBrowserClient detects them on getSession
          const hash = window.location.hash?.replace(/^#/, "") || "";
          if (hash.includes("access_token") || hash.includes("error")) {
            const hashParams = new URLSearchParams(hash);
            const hashErr =
              hashParams.get("error_description") || hashParams.get("error");
            if (hashErr) throw new Error(hashErr.replace(/\+/g, " "));

            // Give the client a moment to parse the URL hash into a session
            const { data, error: sessErr } = await supabase.auth.getSession();
            if (sessErr) throw sessErr;
            if (!data.session) {
              // Explicit setSession if still missing
              const access_token = hashParams.get("access_token");
              const refresh_token = hashParams.get("refresh_token");
              if (access_token && refresh_token) {
                const { error: setErr } = await supabase.auth.setSession({
                  access_token,
                  refresh_token,
                });
                if (setErr) throw setErr;
              } else {
                throw new Error(
                  "Couldn’t complete sign-in from this link. Request a new one."
                );
              }
            }
          } else {
            // Maybe already signed in (e.g. double-open of link)
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
              throw new Error(
                "This confirmation link is incomplete or expired. Request a new one from sign-in."
              );
            }
          }
        }

        // Soft role bootstrap from signup metadata
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

        if (cancelled) return;
        setStatus("ok");
        const dest = next.includes("?")
          ? `${next}&verified=1`
          : `${next}${next.endsWith("/") && next.length > 1 ? "" : ""}`;
        // Prefer clean path + verified query
        const url = new URL(dest, window.location.origin);
        url.searchParams.set("verified", "1");
        router.replace(url.pathname + url.search);
        router.refresh();
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(
          humanizeAuthError(
            e instanceof Error ? e.message : "Couldn’t complete sign-in"
          )
        );
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const next = safeNextPath(searchParams.get("next"), "/");

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
        <Logo href="/" />
        {status === "working" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Confirming your email…
          </p>
        )}
        {status === "ok" && (
          <p className="text-sm text-muted-foreground">You&apos;re in — redirecting…</p>
        )}
        {status === "error" && (
          <div className="w-full space-y-4">
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error || "Couldn’t complete sign-in."}
            </p>
            <p className="text-sm text-muted-foreground">
              Open the latest email we sent, or request a new link.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="inline-flex text-sm font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Confirming…
        </div>
      }
    >
      <ConfirmInner />
    </Suspense>
  );
}
