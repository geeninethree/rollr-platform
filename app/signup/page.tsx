import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";

type PageProps = {
  searchParams?: { next?: string; ref?: string; role?: string };
};

export const metadata = {
  title: "Sign up",
  description: "Create a ROLLR account",
};

export default async function SignupPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const asCreator =
    searchParams?.role === "creator" || Boolean(searchParams?.ref);
  const next =
    searchParams?.next || (asCreator ? "/studio" : "/");
  if (user) redirect(next);

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo href="/" size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {asCreator ? "Sign up as creator" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {asCreator
                ? "Build your portfolio and list for ₹299/mo — 0% commission."
                : "Join as a client (hire) or creator (list for ₹299/mo)."}
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
              defaultRole={asCreator ? "creator" : undefined}
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
