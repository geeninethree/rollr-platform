import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { ensureCreatorRole } from "@/lib/creator-listing";
import { claimRecruiterPath } from "@/lib/roles";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: { next?: string; ref?: string; role?: string };
};

export const metadata = {
  title: "Sign up",
  description: "Create a ROLLR account",
};

export default async function SignupPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const roleParam = searchParams?.role;
  const asCreator =
    roleParam === "creator" || Boolean(searchParams?.ref);
  const asRecruiter = roleParam === "recruiter";
  const next =
    searchParams?.next ||
    (asCreator ? "/studio" : asRecruiter ? "/job-board" : "/");

  // Already signed in: claim the intended path instead of a silent no-op redirect
  if (user) {
    const supabase = getSupabaseServerClient();
    if (supabase && asRecruiter) {
      await claimRecruiterPath(supabase, user.id, {
        full_name:
          (user.user_metadata?.full_name as string) ||
          user.email?.split("@")[0],
        notes: "Claimed via /signup?role=recruiter while signed in",
      });
      redirect("/job-board?recruiter=waitlisted");
    }
    if (supabase && asCreator) {
      await ensureCreatorRole(
        supabase,
        user.id,
        (user.user_metadata?.full_name as string) || user.email?.split("@")[0]
      );
      redirect(next.startsWith("/") ? next : "/studio");
    }
    redirect(next.startsWith("/") ? next : "/");
  }

  const defaultRole =
    asCreator || searchParams?.ref
      ? "creator"
      : asRecruiter
        ? "recruiter"
        : undefined;

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo href="/" size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {asCreator
                ? "Sign up as creator"
                : asRecruiter
                  ? "Sign up as recruiter"
                  : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {asCreator
                ? "Build your portfolio and list for ₹299/mo — 0% commission."
                : asRecruiter
                  ? "Post multiple open jobs · ₹399/mo when billing is live."
                  : "Client · creator · or recruiter — pick your path."}
            </p>
          </div>
        </div>

        <Card className="border-border bg-card/90 shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sign up</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthForm
              mode="signup"
              next={next}
              referralCode={searchParams?.ref}
              defaultRole={defaultRole}
            />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            ← Back to directory
          </Link>
        </p>
      </div>
    </div>
  );
}
