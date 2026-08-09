import { LegalShell } from "@/components/legal/legal-shell";

export const metadata = {
  title: "Refund & billing policy",
  description: "ROLLR subscription refund and no-refund policy.",
};

export default function RefundsPage() {
  return (
    <LegalShell title="Refund & billing policy" updated="9 August 2026">
      <p>
        This policy covers <strong>platform listing fees</strong> (e.g. ₹299/mo
        creator membership). It does <strong>not</strong> cover money paid by
        clients to creators for shoots or edits — those are private contracts.
      </p>

      <h2>1. Alpha / pre-billing</h2>
      <ul>
        <li>
          While payment systems are not live, <strong>no charges</strong> are
          taken for waitlist or signup.
        </li>
        <li>Registering interest creates no payment obligation.</li>
      </ul>

      <h2>2. When billing is live</h2>
      <ul>
        <li>
          Creator membership is a <strong>recurring monthly subscription</strong>{" "}
          (price shown at checkout).
        </li>
        <li>
          You may cancel anytime to stop future renewals. Access continues until
          the end of the paid period unless we state otherwise at checkout.
        </li>
      </ul>

      <h2>3. No refunds (default)</h2>
      <ul>
        <li>
          <strong>No refunds</strong> for partial months, unused leads, or
          change of mind after a successful charge.
        </li>
        <li>
          No refund solely because you received fewer briefs than expected —
          lead volume is not guaranteed.
        </li>
        <li>
          Exception: if we double-charge or charge after a confirmed
          cancellation due to our error, we will refund the erroneous amount.
        </li>
      </ul>

      <h2>4. Chargebacks</h2>
      <p>
        Contact us before filing a chargeback so we can resolve billing issues.
        Fraudulent chargebacks may result in account suspension.
      </p>

      <h2>5. Job payments</h2>
      <p>
        ROLLR does not hold client→creator job funds. Refunds for creative work
        must be arranged between client and creator.
      </p>
    </LegalShell>
  );
}
