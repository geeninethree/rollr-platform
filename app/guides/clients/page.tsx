import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Client guide",
  description:
    "How to find and hire a Mumbai photographer or editor on ROLLR.",
};

export default function ClientGuidePage() {
  return (
    <LegalShell title="Client guide" updated="11 August 2026">
      <p>
        You&apos;re hiring. ROLLR is a Mumbai directory of photographers,
        videographers, and editors — browse profiles, send a short brief, and
        talk to them on WhatsApp when they&apos;re free for your job.{" "}
        <strong>0% commission</strong> on the booking.
      </p>

      <h2>1. Find someone</h2>
      <ul>
        <li>
          Browse{" "}
          <Link href="/" className="text-primary">
            Photographers
          </Link>{" "}
          or{" "}
          <Link href="/editors" className="text-primary">
            Editors
          </Link>
        </li>
        <li>Filter by neighbourhood, category, or search</li>
        <li>
          Open a profile — portfolio, areas, and package floors (from prices)
        </li>
      </ul>

      <h2>2. Send a brief</h2>
      <ul>
        <li>
          On their profile, tap <strong>Send brief</strong>
        </li>
        <li>
          Tell them what you need: your name, WhatsApp, date, area, budget, and
          a short note
        </li>
        <li>
          You can save your details on this device for the next brief
        </li>
        <li>
          You&apos;re not hunting public phone numbers — you leave a clear
          request and they reply if it&apos;s a fit
        </li>
      </ul>

      <h2>3. Wait for their reply on WhatsApp</h2>
      <ul>
        <li>
          If they take the job, <strong>they message you</strong> on WhatsApp
          (using the number you put in the brief)
        </li>
        <li>
          They see the brief in their ROLLR Inbox (and get an email when we have
          notifications enabled)
        </li>
        <li>
          Signed in? Track what you sent under{" "}
          <Link href="/my-briefs" className="text-primary">
            My briefs
          </Link>
        </li>
        <li>Agree scope, timing, and payment with them directly</li>
        <li>
          Creators may send a quote, booking confirmation, or invoice via ROLLR
          (share links) — you still pay them directly, not ROLLR
        </li>
        <li>ROLLR does not take a cut of what you pay the creator</li>
      </ul>

      <h2>4. Or post an open job</h2>
      <ul>
        <li>
          Prefer many people to apply? Use the{" "}
          <Link href="/job-board" className="text-primary">
            Job board
          </Link>
        </li>
        <li>
          Sign up (free), post one open job at a time — creators pitch, you
          accept, then they WhatsApp you
        </li>
        <li>
          Agencies posting lots of open roles can join the recruiter waitlist
          on the same page (multi-job plan later)
        </li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>Be specific on date, location, and budget — better replies</li>
        <li>Check portfolio work and package floors before briefing</li>
        <li>
          Payment is between you and the creator (UPI, bank, cash — whatever you
          agree)
        </li>
        <li>
          On your phone?{" "}
          <Link href="/install" className="text-primary">
            Add ROLLR to your home screen
          </Link>{" "}
          (iPhone Safari / Android Chrome) for one-tap access
        </li>
      </ul>

      <div className="not-prose mt-6 flex flex-wrap gap-2">
        <Button asChild className="font-semibold">
          <Link href="/">Find a photographer</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/editors">Find an editor</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/job-board">Job board</Link>
        </Button>
      </div>
    </LegalShell>
  );
}
