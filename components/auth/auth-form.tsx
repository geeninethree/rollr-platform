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
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase is not configured. Add keys to .env.local and restart the dev server."
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

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
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        const newId = data.user?.id;
        const code = refCode || getReferralCodeLocal();
        if (newId && code) {
          await attachReferralOnSignup(supabase, newId, code);
          clearReferralCodeLocal();
        }

        // If email confirmation is off, session exists immediately
        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }

        setMessage(
          "Check your email to confirm your account — or disable “Confirm email” in Supabase Auth settings for local testing." +
            (code
              ? ` Referral ${code} will apply when you confirm.`
              : "")
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setError(null);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data:
            mode === "signup"
              ? { full_name: fullName.trim() || email.split("@")[0], role }
              : undefined,
        },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMessage("Magic link sent — check your inbox (and spam).");
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
          Referral cashback is{" "}
          <strong className="uppercase tracking-wide text-amber-200">
            not currently active — alpha testing phase
          </strong>
          . Code is saved for when payouts go live (₹{REFERRAL_CASHBACK_INR} on
          publish).
        </p>
      )}
      {mode === "signup" && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="full-name" className="text-xs font-medium text-muted-foreground">
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
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["client", "Client"],
                  ["creator", "Creator"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
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
              Clients send briefs. Creators list profiles and accept jobs.
            </p>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
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
        <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
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
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
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
