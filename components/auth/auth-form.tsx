"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  attachReferralOnSignup,
  clearReferralCodeLocal,
  getReferralCodeLocal,
  REFERRAL_CASHBACK_INR,
  saveReferralCodeLocal,
} from "@/lib/referrals";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import {
  connectionErrorMessage,
  humanizeAuthError,
  safeNextPath,
} from "@/lib/user-messages";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  next?: string;
  /** Invite code from ?ref= */
  referralCode?: string;
  /** Prefill role (e.g. creator from ?role=creator) */
  defaultRole?: UserRole;
};

export function AuthForm({
  mode,
  next = "/",
  referralCode,
  defaultRole,
}: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(
    defaultRole || (referralCode ? "creator" : "client")
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [refCode, setRefCode] = useState(
    () => referralCode?.trim().toLowerCase() || ""
  );

  useEffect(() => {
    if (referralCode?.trim()) {
      const c = referralCode.trim().toLowerCase();
      saveReferralCodeLocal(c);
      setRefCode(c);
      return;
    }
    const stored = getReferralCodeLocal();
    if (stored) setRefCode(stored);
  }, [referralCode]);

  async function resendConfirmation() {
    setError(null);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(connectionErrorMessage());
      return;
    }
    const destEmail = email.trim();
    if (!destEmail) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    try {
      const dest = safeNextPath(next, "/");
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: destEmail,
        options: {
          emailRedirectTo: getAuthCallbackUrl(dest),
        },
      });
      if (resendError) {
        // Fallback: magic link often works when resend type is restricted
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: destEmail,
          options: { emailRedirectTo: getAuthCallbackUrl(dest) },
        });
        if (otpError) {
          setError(humanizeAuthError(resendError.message || otpError.message));
          return;
        }
      }
      setNeedsConfirm(true);
      setMessage(
        "New link sent — check your inbox and spam folder. Use the latest email only."
      );
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setNeedsConfirm(false);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(connectionErrorMessage());
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const dest = safeNextPath(
      next,
      role === "recruiter" ? "/job-board" : role === "creator" ? "/studio" : "/"
    );

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split("@")[0],
              role,
            },
            emailRedirectTo: getAuthCallbackUrl(dest),
          },
        });

        if (signUpError) {
          const msg = signUpError.message || "";
          if (
            msg.toLowerCase().includes("already") ||
            msg.toLowerCase().includes("registered")
          ) {
            setError(
              "An account with this email already exists. Sign in, or resend confirmation if you haven’t verified yet."
            );
            setNeedsConfirm(true);
            return;
          }
          setError(humanizeAuthError(msg));
          return;
        }

        // Supabase returns a user with empty identities when email is already registered
        // (security: no error). Treat as existing account.
        const identities = data.user?.identities;
        if (data.user && Array.isArray(identities) && identities.length === 0) {
          setError(
            "An account with this email already exists. Sign in, or resend confirmation if you haven’t verified yet."
          );
          setNeedsConfirm(true);
          return;
        }

        const newId = data.user?.id;
        const code = refCode || getReferralCodeLocal();
        if (newId && code && data.session) {
          await attachReferralOnSignup(supabase, newId, code);
          clearReferralCodeLocal();
        } else if (code) {
          // Keep code for after confirm
          saveReferralCodeLocal(code);
        }

        // Soft side-effects — never block signup
        if (newId) {
          if (role === "recruiter") {
            try {
              if (data.session) {
                const { claimRecruiterPath } = await import("@/lib/roles");
                await claimRecruiterPath(supabase, newId, {
                  full_name: fullName.trim() || email.split("@")[0],
                  notes: "Recruiter signup",
                });
              } else {
                const { submitWaitlist } = await import("@/lib/waitlist");
                await submitWaitlist(supabase, {
                  full_name: fullName.trim() || email.split("@")[0],
                  email: email.trim(),
                  role: "recruiter",
                  primary_category: "Multi-job board",
                  notes: "Recruiter signup (email confirm pending)",
                });
              }
            } catch (err) {
              console.warn("[rollr] recruiter waitlist soft-fail", err);
            }
          } else if (data.session) {
            const { error: roleError } = await supabase
              .from("profiles")
              .update({
                role,
                full_name: fullName.trim() || email.split("@")[0],
                updated_at: new Date().toISOString(),
              })
              .eq("id", newId);
            if (roleError) {
              console.warn("[rollr] role save soft-fail", roleError.message);
            }
          }
        }

        // Email confirm off → session immediately
        if (data.session) {
          if (role === "recruiter") {
            setMessage(
              "Account created. You can post 1 open job now. Multi-job access is on the waitlist."
            );
            setTimeout(() => {
              router.push(dest || "/job-board");
              router.refresh();
            }, 1600);
            return;
          }
          router.push(dest);
          router.refresh();
          return;
        }

        // Confirm email required
        setNeedsConfirm(true);
        setMessage(
          role === "recruiter"
            ? "Check your email to confirm your account (and spam). You’re also on the multi-job waitlist."
            : "Check your email to confirm your account (and spam folder), then open the latest link we sent."
        );
        return;
      }

      // ── Login ─────────────────────────────────────────────
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const msg = signInError.message || "";
        if (
          msg.toLowerCase().includes("email not confirmed") ||
          msg.toLowerCase().includes("not confirmed")
        ) {
          setNeedsConfirm(true);
          setError(
            "Please confirm your email first. Check inbox/spam, or resend the link below."
          );
          return;
        }
        setError(humanizeAuthError(msg));
        return;
      }

      // Apply pending referral after login
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const pendingRef = getReferralCodeLocal();
      if (user && pendingRef) {
        await attachReferralOnSignup(supabase, user.id, pendingRef);
        clearReferralCodeLocal();
      }

      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(
        humanizeAuthError(
          err instanceof Error ? err.message : "Something went wrong"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setError(null);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(connectionErrorMessage());
      return;
    }
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    const dest = safeNextPath(next, "/");
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: getAuthCallbackUrl(dest),
          shouldCreateUser: mode === "signup",
          data:
            mode === "signup"
              ? { full_name: fullName.trim() || email.split("@")[0], role }
              : undefined,
        },
      });
      if (otpError) {
        setError(humanizeAuthError(otpError.message));
        return;
      }
      setNeedsConfirm(true);
      setMessage("Link sent — check your inbox and spam folder.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && refCode && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
          Invite code{" "}
          <span className="font-mono font-semibold text-primary">{refCode}</span>
          {" · "}
          Saved for when referral cashback goes live (₹{REFERRAL_CASHBACK_INR}).
        </p>
      )}
      {mode === "signup" && (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="full-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Full name
            </label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="bg-background/50"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">I am a…</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["client", "Client"],
                  ["creator", "Creator"],
                  ["recruiter", "Recruiter"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                    role === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Client: post 1 free open job. Creator: portfolio + pitch. Recruiter:
              multi-job board (₹399/mo when live — join waitlist on signup).
            </p>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-medium text-muted-foreground"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="bg-background/50"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-xs font-medium text-muted-foreground"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-background/50"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={6}
          formNoValidate={false}
        />
        <p className="text-[11px] text-muted-foreground">
          Password required for Create account / Sign in. Magic link below works
          with email only.
        </p>
      </div>

      {error && (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      )}

      {needsConfirm && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={loading || !email.trim()}
          onClick={() => void resendConfirmation()}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Resend confirmation email"
          )}
        </Button>
      )}

      <Button type="submit" className="w-full font-semibold" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Please wait…
          </>
        ) : mode === "signup" ? (
          "Create account"
        ) : (
          "Sign in"
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => void sendMagicLink()}
      >
        Email me a magic link
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link
              href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
