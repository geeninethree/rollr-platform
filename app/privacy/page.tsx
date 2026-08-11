import { LegalShell } from "@/components/legal/legal-shell";

export const metadata = {
  title: "Privacy Policy",
  description: "How ROLLR collects and uses personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="9 August 2026">
      <p>
        This policy explains what data ROLLR collects and how we use it. We aim
        to keep creator phone numbers private and only share client WhatsApp
        after a creator accepts a brief.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email, role (client/creator/recruiter),
          optional phone, avatar.
        </li>
        <li>
          <strong>Creator listing:</strong> bio, areas, categories, package
          prices, portfolio images/links, cover, listing status.
        </li>
        <li>
          <strong>Waitlist:</strong> name, email, WhatsApp, role, category when
          you register interest.
        </li>
        <li>
          <strong>Briefs / inquiries:</strong> client name, WhatsApp, email,
          event details, message, status.
        </li>
        <li>
          <strong>Technical:</strong> basic logs and auth sessions via Supabase
          / Vercel (IP, user agent as processed by those providers).
        </li>
      </ul>

      <h2>2. How we use data</h2>
      <ul>
        <li>Operate the directory and creator portfolios</li>
        <li>Deliver briefs to the right creator and enable WhatsApp after accept</li>
        <li>Review waitlist signups and contact interested creators</li>
        <li>Improve product reliability and prevent abuse</li>
      </ul>

      <h2>3. Sharing</h2>
      <ul>
        <li>
          <strong>Public:</strong> published creator profiles (name, portfolio,
          rates, areas) are visible to anyone on the site.
        </li>
        <li>
          <strong>Creators:</strong> receive client brief details; WhatsApp is
          intended to be used only after accept.
        </li>
        <li>
          <strong>Processors:</strong> Supabase (database/auth/storage), Vercel
          (hosting). Their policies apply to infrastructure processing.
        </li>
        <li>We do not sell personal data.</li>
      </ul>

      <h2>4. Retention</h2>
      <p>
        We keep account and listing data while your account is active. Waitlist
        and inquiry data are retained for operations and dispute context, then
        may be deleted or anonymised on request where feasible.
      </p>

      <h2>5. Security</h2>
      <p>
        We use industry-standard providers and access controls (including RLS on
        Supabase). No method is 100% secure; report issues promptly.
      </p>

      <h2>6. Your choices</h2>
      <ul>
        <li>Update profile/portfolio when signed in</li>
        <li>Request deletion of your account/data by contacting us</li>
        <li>Decline cookies where the browser allows (essential auth may still run)</li>
      </ul>

      <h2>7. Children</h2>
      <p>
        ROLLR is not directed at children under 18. Do not create an account if
        you are under 18.
      </p>

      <h2>8. Contact</h2>
      <p>
        Privacy requests: contact the ROLLR team via the channel you already use
        for alpha onboarding.
      </p>
    </LegalShell>
  );
}
