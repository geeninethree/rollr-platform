/**
 * One-off: send a polished test email via Resend.
 *
 *   # .env.local needs:
 *   # RESEND_API_KEY=re_...
 *   # EMAIL_FROM=ROLLR <onboarding@resend.dev>
 *
 *   npx tsx --env-file=.env.local scripts/send-test-email.ts
 */
import { briefNotifyEmail, sendEmail } from "../lib/email";

async function main() {
  const to = process.env.TEST_EMAIL || "tintu.gautam@gmail.com";
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://rollrgigs.vercel.app";

  if (!process.env.RESEND_API_KEY) {
    console.error(
      [
        "Missing RESEND_API_KEY — cannot send.",
        "",
        "1) https://resend.com → API Keys → create key",
        "2) Add to .env.local:",
        "     RESEND_API_KEY=re_...",
        "     EMAIL_FROM=ROLLR <onboarding@resend.dev>",
        "3) Re-run:",
        "     npx tsx --env-file=.env.local scripts/send-test-email.ts",
        "",
        "Note: with onboarding@resend.dev, Resend usually only delivers",
        "to the email on your Resend account until you verify a domain.",
      ].join("\n")
    );
    process.exit(1);
  }

  const mail = briefNotifyEmail({
    creatorName: "Tintu",
    clientName: "Priya (test client)",
    category: "Wedding",
    location: "Bandra",
    eventDate: "2026-09-12",
    message:
      "This is a mock ROLLR brief email — checking branding, layout, and deliverability. You can ignore it.",
    inboxUrl: `${site}/inbox`,
  });

  const result = await sendEmail({
    to,
    subject: `[TEST] ${mail.subject}`,
    html: mail.html,
    text: mail.text,
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  if (result.skipped) {
    console.error("Email was skipped (no API key loaded).");
    process.exit(1);
  }
  console.log(`Sent test brief email to ${to}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
