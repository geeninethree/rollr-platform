import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";

type PageProps = {
  searchParams?: { next?: string; error?: string };
};

export const metadata = {
  title: "Sign in",
  description: "Sign in to ROLLR",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const next = searchParams?.next || "/";
  if (user) redirect(next);

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo href="/" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to send briefs or manage your creator listing.
            </p>
          </div>
        </div>

        <Card className="border-border bg-card/90 shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            {searchParams?.error && (
              <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {searchParams.error}
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
