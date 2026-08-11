import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Creator guide",
  description:
    "How to list as a photographer or editor on ROLLR and get briefs.",
};

export default function CreatorGuidePage() {
  return (
    <LegalShell title="Creator guide" updated="11 August 2026">
      <p>
        You&apos;re a photographer, videographer, or editor. This is how you
        get a live profile on ROLLR, receive client briefs, and keep 100% of
        what you charge — membership is <strong>₹299/mo</strong> when billing
        is live (alpha: list via portfolio; no payment taken yet).
      </p>

      <h2>1. Join (pick a path)</h2>
      <p>
        <strong>Register interest</strong> (optional waitlist):{" "}
        <Link href="/list#join" className="text-primary">
          Pricing &amp; interest
        </Link>
        . We review signups in admin.
      </p>
      <p>
        <strong>Or go straight to alpha signup:</strong>
      </p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          <Link href="/signup?role=creator&next=/studio" className="text-primary">
            Sign up as creator
          </Link>
        </li>
        <li>Confirm email if Supabase asks for it</li>
        <li>
          Open <strong>Portfolio</strong> (
          <Link href="/studio" className="text-primary">
            /studio
          </Link>
          )
        </li>
      </ol>

      <h2>2. Build your listing</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Add name, bio, areas, categories, package prices, avatar/cover, and
          work samples
        </li>
        <li>
          Pass the quality checklist → <strong>Submit for review</strong>
        </li>
        <li>
          When ROLLR publishes you, you appear on{" "}
          <Link href="/" className="text-primary">
            Photographers
          </Link>{" "}
          /{" "}
          <Link href="/editors" className="text-primary">
            Editors
          </Link>
        </li>
      </ol>

      <h2>3. Briefs (clients find you)</h2>
      <ul>
        <li>Clients open your profile and send a brief with their WhatsApp</li>
        <li>
          You get an email when Resend is configured — always check{" "}
          <Link href="/inbox" className="text-primary">
            Inbox
          </Link>{" "}
          while signed in
        </li>
        <li>Accept → WhatsApp opens to the client</li>
        <li>
          Your phone number is never shown on your public profile — you choose
          when to reach out
        </li>
        <li>
          When we publish your listing, we email you (if notifications are on)
        </li>
      </ul>

      <h2>4. Job board (optional)</h2>
      <ul>
        <li>
          Open calls live on the{" "}
          <Link href="/job-board" className="text-primary">
            Job board
          </Link>
        </li>
        <li>
          Sign in as a creator → pitch jobs → when the poster accepts, you
          WhatsApp them
        </li>
      </ul>

      <h2>Share your profile</h2>
      <p>
        After you&apos;re published, copy your profile URL from Portfolio (share
        card): <code>/creators/&lt;id&gt;</code>
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
        <Button asChild variant="outline">
          <Link href="/studio">Portfolio</Link>
        </Button>
      </div>
    </LegalShell>
  );
}
