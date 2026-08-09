import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-grid-fade">
      <article className="prose-invert mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {updated} · Alpha / India
        </p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline">
          {children}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            ← Back to ROLLR
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-primary">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-primary">
            Privacy
          </Link>
          {" · "}
          <Link href="/refunds" className="hover:text-primary">
            Refunds
          </Link>
          {" · "}
          <Link href="/guides/clients" className="hover:text-primary">
            Client guide
          </Link>
          {" · "}
          <Link href="/guides/creators" className="hover:text-primary">
            Creator guide
          </Link>
        </p>
      </article>
    </div>
  );
}
