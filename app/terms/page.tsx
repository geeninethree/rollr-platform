import { LegalShell } from "@/components/legal/legal-shell";

export const metadata = {
  title: "Terms of Service",
  description: "ROLLR terms of service for clients and creators.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="9 August 2026">
      <p>
        Welcome to <strong>ROLLR</strong> (“we”, “us”, “platform”), a Mumbai
        directory connecting clients with photographers, videographers, and
        editors. By using rollr-platform on the web (including Vercel-hosted
        production), you agree to these Terms.
      </p>

      <h2>1. What ROLLR is (and is not)</h2>
      <ul>
        <li>
          ROLLR is a <strong>discovery and messaging facilitation</strong>{" "}
          service. We list creator portfolios and help clients send briefs.
        </li>
        <li>
          We are <strong>not</strong> a party to any shoot, edit, or booking
          contract between client and creator.
        </li>
        <li>
          Payment for creative work happens <strong>directly</strong> between
          client and creator. ROLLR does not currently process job payments.
        </li>
        <li>
          Platform listing fees (₹299/mo when billing is live) are separate from
          job invoices.
        </li>
      </ul>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information when signing up.</li>
        <li>
          You are responsible for activity under your account and for keeping
          login credentials secure.
        </li>
        <li>
          Creators must only list services they can lawfully deliver and only
          use portfolio work they have rights to display.
        </li>
      </ul>

      <h2>3. Creator listings</h2>
      <ul>
        <li>
          Published listings appear in the public directory. You can update or
          unpublish via Portfolio (subject to product features).
        </li>
        <li>
          We may remove listings that are spam, misleading, infringing,
          illegal, or harmful without notice.
        </li>
        <li>
          During alpha, self-publish may be available; we may later require
          manual review before publish.
        </li>
      </ul>

      <h2>4. Briefs &amp; WhatsApp</h2>
      <ul>
        <li>
          Clients submit briefs including a WhatsApp number. Creator numbers are
          not shown publicly by design.
        </li>
        <li>
          When a creator accepts a brief, they may open WhatsApp to the client.
          Further negotiation is off-platform.
        </li>
        <li>
          Do not use ROLLR to spam, harass, or share others&apos; contact details
          without consent.
        </li>
      </ul>

      <h2>5. Fees</h2>
      <ul>
        <li>
          Creator membership is advertised at <strong>₹299/month</strong> with{" "}
          <strong>0% commission</strong> on jobs. Billing may not be live during
          alpha.
        </li>
        <li>
          Waitlist registration does not create a paid subscription or charge a
          card.
        </li>
        <li>See our Refund Policy for subscription rules once payments ship.</li>
      </ul>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Upload illegal, infringing, or explicit content without consent</li>
        <li>Scrape the directory or reverse-engineer the service for abuse</li>
        <li>Impersonate others or misrepresent rates/availability</li>
      </ul>

      <h2>7. Disclaimers</h2>
      <p>
        The platform is provided <strong>“as is”</strong> during alpha. We do
        not guarantee uninterrupted uptime, lead volume, or quality of any
        creator&apos;s work. Disputes over shoots/edits are between client and
        creator.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by Indian law, ROLLR and its operators
        are not liable for indirect or consequential damages arising from use of
        the platform or from off-platform bookings. Aggregate liability for
        platform fees paid in the prior 3 months is limited to those fees.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these Terms. Continued use after changes constitutes
        acceptance. Material changes may be noted on this page with a new “Last
        updated” date.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions: use the contact method listed on the live site or the email
        you used to communicate with the ROLLR team during alpha.
      </p>
    </LegalShell>
  );
}
