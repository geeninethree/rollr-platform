import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { Button } from "@/components/ui/button";
import { BUSINESS_KIT_BULLETS } from "@/lib/business-kit";

export const metadata = {
  title: "Creator guide",
  description:
    "How to list as a photographer or editor on ROLLR, get briefs, and use invoices, quotes, and the business kit.",
};

export default function CreatorGuidePage() {
  return (
    <LegalShell title="Creator guide" updated="13 August 2026">
      <p>
        You&apos;re a photographer, videographer, or editor. This is how you
        get a live profile on ROLLR, receive client briefs, run the job with
        built-in tools, and keep 100% of what you charge — membership is{" "}
        <strong>₹299/mo</strong> when billing is live (alpha: list via
        portfolio; no payment taken yet).
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
        <li>Confirm your email if we send you a link</li>
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
          while signed in (top of the nav for creators)
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

      <h2>5. After the job — business kit</h2>
      <p>
        Directory + WhatsApp is only half the work. Signed-in creators get a{" "}
        <Link href="/tools" className="text-primary">
          Business kit
        </Link>{" "}
        (previewable before signup) so quote → book → invoice → deliver stays
        organised. <strong>You are always the seller</strong> — ROLLR does not
        collect payment or take a cut.
      </p>
      <ul>
        {BUSINESS_KIT_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>
        From an accepted brief in Inbox you can jump to{" "}
        <strong>Quote</strong>, <strong>Booking</strong>,{" "}
        <strong>Invoice</strong>, or <strong>Delivery</strong> with client
        details prefilled. Payment reminders open WhatsApp to the client with
        the invoice link.
      </p>
      <p>
        Preview without an account:{" "}
        <Link href="/tools" className="text-primary">
          /tools
        </Link>
        . Full plan copy:{" "}
        <Link href="/list#business-kit" className="text-primary">
          /list#business-kit
        </Link>
        .
      </p>

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
          <Link href="/tools">Preview business kit</Link>
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
