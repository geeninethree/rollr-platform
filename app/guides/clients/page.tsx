import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Client guide",
  description: "How to find a photographer or editor on ROLLR.",
};

export default function ClientGuidePage() {
  return (
    <LegalShell title="Client guide" updated="9 August 2026">
      <p>How to hire on ROLLR without the creator&apos;s number being public.</p>

      <h2>1. Browse</h2>
      <ul>
        <li>
          <Link href="/">Photographers</Link> or{" "}
          <Link href="/editors">Editors</Link>
        </li>
        <li>Filter by area, category, date</li>
        <li>Open a profile and review portfolio + package floors</li>
      </ul>

      <h2>2. Send a brief</h2>
      <ul>
        <li>
          Tap <strong>Send brief</strong> — not a public phone number
        </li>
        <li>Include your name, WhatsApp, date, location, budget, message</li>
        <li>Optional: save your details for the next creator</li>
      </ul>

      <h2>3. They accept → WhatsApp</h2>
      <ul>
        <li>If they accept, they message you on WhatsApp</li>
        <li>Negotiate scope and pay them directly</li>
        <li>ROLLR takes 0% of the job</li>
      </ul>

      <h2>4. Post to job board?</h2>
      <p>
        Public job posts are not live yet. Use profile briefs for now. The Job
        Board page will open for open calls later.
      </p>

      <div className="not-prose mt-6 flex flex-wrap gap-2">
        <Button asChild className="font-semibold">
          <Link href="/">Find a photographer</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/editors">Find an editor</Link>
        </Button>
      </div>
    </LegalShell>
  );
}
