/**
 * Transactional email via Resend (optional).
 * Set RESEND_API_KEY + EMAIL_FROM in env. Without keys, notify is no-op (logged).
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "ROLLR <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      "[email] RESEND_API_KEY not set — skipped:",
      input.to,
      input.subject
    );
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Email send failed",
    };
  }
}

export function briefNotifyEmail(input: {
  creatorName: string;
  clientName: string;
  category: string;
  location: string;
  eventDate?: string;
  message: string;
  inboxUrl: string;
}) {
  const when = input.eventDate ? ` · ${input.eventDate}` : "";
  const subject = `New ROLLR brief from ${input.clientName}`;
  const text = [
    `Hi ${input.creatorName},`,
    ``,
    `${input.clientName} sent you a brief on ROLLR.`,
    `${input.category}${when} · ${input.location}`,
    ``,
    input.message,
    ``,
    `Open your inbox to accept and WhatsApp them:`,
    input.inboxUrl,
    ``,
    `— ROLLR`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5;color:#18181b">
      <p>Hi ${escapeHtml(input.creatorName)},</p>
      <p><strong>${escapeHtml(input.clientName)}</strong> sent you a brief on ROLLR.</p>
      <p style="color:#52525b;font-size:14px">
        ${escapeHtml(input.category)}${escapeHtml(when)} · ${escapeHtml(input.location)}
      </p>
      <blockquote style="border-left:3px solid #eab308;padding-left:12px;color:#3f3f46">
        ${escapeHtml(input.message)}
      </blockquote>
      <p>
        <a href="${escapeHtml(input.inboxUrl)}"
           style="display:inline-block;background:#eab308;color:#09090b;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
          Open inbox → Accept
        </a>
      </p>
      <p style="font-size:12px;color:#71717a">Your number stays private until you accept.</p>
    </div>
  `;

  return { subject, html, text };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
