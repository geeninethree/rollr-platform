import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Creator guide",
  description: "How to list on ROLLR and get published on the live site.",
};

export default function CreatorGuidePage() {
  return (
    <LegalShell title="Creator guide" updated="9 August 2026">
      <p>
        How a photographer, videographer, or editor goes from invite link to a{" "}
        <strong>live profile on the Vercel site</strong>.
      </p>

      <h2>Path A — You approve them from waitlist</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          They open{" "}
          <Link href="/list#join" className="text-primary">
            /list → Register interest
          </Link>
        </li>
        <li>
          You see them in{" "}
          <Link href="/admin" className="text-primary">
            /admin
          </Link>{" "}
          (or Supabase → <code>waitlist_signups</code>)
        </li>
        <li>Mark status <strong>approved</strong></li>
        <li>
          Send them this link:{" "}
          <code className="text-primary">
            https://rollr-platform-gig.vercel.app/signup?role=creator&amp;next=/studio
          </code>
        </li>
        <li>They complete Path B below</li>
      </ol>

      <h2>Path B — Direct signup (alpha)</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          <strong>Sign up</strong> as creator (link above or{" "}
          <Link href="/signup?role=creator&next=/studio">Sign up as creator</Link>
          )
        </li>
        <li>
          Confirm email if Supabase requires it
        </li>
        <li>
          Open <strong>Portfolio</strong> (<code>/studio</code>)
        </li>
        <li>
          Fill name, bio, areas, categories, package prices, avatar/cover,
          portfolio works
        </li>
        <li>
          Pass quality checks → <strong>Submit for review</strong>
        </li>
        <li>
          ROLLR admin approves on{" "}
          <code className="text-primary">/admin</code> → status becomes{" "}
          <strong>published</strong>
        </li>
        <li>
          Profile appears on{" "}
          <Link href="/" className="text-primary">
            Photographers
          </Link>{" "}
          /{" "}
          <Link href="/editors" className="text-primary">
            Editors
          </Link>{" "}
          (published only)
        </li>
      </ol>

      <h2>Briefs &amp; WhatsApp</h2>
      <ul>
        <li>Clients open your profile → Send brief (their WhatsApp)</li>
        <li>
          You open <Link href="/inbox">Inbox</Link> (signed in) → Accept → WhatsApp
          opens to the client
        </li>
        <li>Your phone number stays private</li>
      </ul>

      <h2>Share link for friends</h2>
      <p>
        After publish, copy your profile URL from Portfolio share card:{" "}
        <code>/creators/&lt;id&gt;</code>
      </p>

      <div className="not-prose mt-6 flex flex-wrap gap-2">
        <Button asChild className="font-semibold">
          <Link href="/signup?role=creator&next=/studio">
            Sign up as creator
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/list">Pricing &amp; waitlist</Link>
        </Button>
      </div>
    </LegalShell>
  );
}
