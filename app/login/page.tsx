import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { humanizeAuthError, safeNextPath } from "@/lib/user-messages";

type PageProps = {
  searchParams?: { next?: string; error?: string };
};

export const metadata = {
  title: "Sign in",
  description: "Sign in to ROLLR",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const next = safeNextPath(searchParams?.next, "/");
  if (user) redirect(next);

  const errorMsg = searchParams?.error
    ? humanizeAuthError(searchParams.error)
    : null;

  return (
    <div className="bg-grid-fade min-h-[70vh]">
      <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo href="/" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-white/40">
              Sign in to send briefs or manage your listing.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-white">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}
            <AuthForm mode="login" next={next} />
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
