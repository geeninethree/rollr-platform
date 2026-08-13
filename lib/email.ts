/**
 * Transactional email via Resend (optional).
 * Set RESEND_API_KEY + EMAIL_FROM in env. Without keys, notify is no-op (logged).
 *
 * Templates match ROLLR site: charcoal / noir + champagne gold CTAs.
 *
 * Emails:
 * - New client brief → creator (+ optional admin copy)
 * - Listing published / rejected → creator
 * - Waitlist signup → admin
 */

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type EmailPayload = { subject: string; html: string; text: string };

/** Site base for footer links */
export function getEmailSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://rollrgigs.vercel.app"
  );
}

/** Server-side admin emails for ops alerts */
export function getNotifyAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "ROLLR <onboarding@resend.dev>";

  const to = Array.isArray(input.to) ? input.to : [input.to];
  if (to.length === 0) {
    return { ok: true, skipped: true };
  }

  if (!apiKey) {
    console.info(
      "[email] RESEND_API_KEY not set — skipped:",
      to.join(","),
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
        to,
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

/* ─── Brand shell (table layout for email clients) ───────────────────────── */

const GOLD = "#C9A84C";
const GOLD_SOFT = "#E8C96A";
const BG = "#0a0a0b";
const CARD = "#141416";
const BORDER = "#2a2a2e";
const TEXT = "#f4f1ea";
const MUTED = "#9a9690";

function siteUrl() {
  return getEmailSiteUrl();
}

/**
 * Shared ROLLR noir layout — champagne gold wordmark, dark card, gold CTA.
 */
export function emailShell(input: {
  preheader?: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  footerNote?: string;
}): string {
  const pre = escapeHtml(input.preheader || input.title);
  const site = siteUrl();
  const year = new Date().getFullYear();

  const ctaBlock = input.cta
    ? `
      <tr>
        <td style="padding:8px 0 4px 0;">
          <a href="${escapeHtml(input.cta.href)}"
             style="display:inline-block;background:${GOLD};color:#0a0a0b;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.01em;">
            ${escapeHtml(input.cta.label)}
          </a>
        </td>
      </tr>`
    : "";

  const secondaryBlock = input.secondaryCta
    ? `
      <tr>
        <td style="padding:10px 0 0 0;">
          <a href="${escapeHtml(input.secondaryCta.href)}"
             style="color:${GOLD_SOFT};font-size:13px;text-decoration:underline;text-underline-offset:3px;">
            ${escapeHtml(input.secondaryCta.label)}
          </a>
        </td>
      </tr>`
    : "";

  const eyebrow = input.eyebrow
    ? `<p style="margin:0 0 10px 0;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${GOLD};">${escapeHtml(input.eyebrow)}</p>`
    : "";

  const footerNote = input.footerNote
    ? `<p style="margin:0 0 12px 0;font-size:12px;line-height:1.5;color:${MUTED};">${escapeHtml(input.footerNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <!-- preheader (inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${pre}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
    <tr>
      <td align="center" style="padding:28px 16px 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding:0 0 22px 0;">
              <a href="${escapeHtml(site)}" style="text-decoration:none;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;letter-spacing:0.2em;color:${TEXT};">
                  R<span style="color:${GOLD};display:inline-block;width:0.95em;text-align:center;">◎</span>LLR
                </span>
              </a>
              <div style="margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">
                Mumbai · 0% commission
              </div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:28px 24px 26px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${TEXT};">
                    ${eyebrow}
                    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.25;font-weight:600;letter-spacing:-0.02em;color:${TEXT};">
                      ${escapeHtml(input.title)}
                    </h1>
                    <div style="font-size:15px;line-height:1.6;color:${MUTED};">
                      ${input.bodyHtml}
                    </div>
                  </td>
                </tr>
                ${ctaBlock}
                ${secondaryBlock}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:22px 8px 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              ${footerNote}
              <p style="margin:0 0 8px 0;font-size:12px;color:${MUTED};">
                <a href="${escapeHtml(site)}" style="color:${GOLD_SOFT};text-decoration:none;">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(site + "/guides/creators")}" style="color:${MUTED};text-decoration:none;">Creator guide</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(site + "/privacy")}" style="color:${MUTED};text-decoration:none;">Privacy</a>
              </p>
              <p style="margin:0;font-size:11px;color:#5c5a56;">
                © ${year} ROLLR · Alpha · Transactional notice
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function mutedP(html: string) {
  return `<p style="margin:0 0 14px 0;color:${MUTED};font-size:15px;line-height:1.6;">${html}</p>`;
}

function strongText(s: string) {
  return `<strong style="color:${TEXT};font-weight:600;">${escapeHtml(s)}</strong>`;
}

function metaLine(s: string) {
  return `<p style="margin:0 0 16px 0;font-size:13px;color:${MUTED};letter-spacing:0.02em;">${escapeHtml(s)}</p>`;
}

function quoteBlock(s: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
      <tr>
        <td style="border-left:3px solid ${GOLD};padding:10px 0 10px 14px;color:${TEXT};font-size:14px;line-height:1.55;">
          ${escapeHtml(s)}
        </td>
      </tr>
    </table>`;
}

function detailRows(rows: { label: string; value: string }[]) {
  const items = rows
    .filter((r) => r.value)
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${MUTED};width:110px;vertical-align:top;">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;font-size:13px;color:${TEXT};">${escapeHtml(r.value)}</td>
      </tr>`
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
      ${items}
    </table>`;
}

/* ─── Templates ──────────────────────────────────────────────────────────── */

export function briefNotifyEmail(input: {
  creatorName: string;
  clientName: string;
  category: string;
  location: string;
  eventDate?: string;
  message: string;
  inboxUrl: string;
}): EmailPayload {
  const when = input.eventDate ? ` · ${input.eventDate}` : "";
  const subject = `New ROLLR brief from ${input.clientName}`;
  const meta = `${input.category}${when} · ${input.location}`;

  const text = [
    `Hi ${input.creatorName},`,
    ``,
    `${input.clientName} sent you a brief on ROLLR.`,
    meta,
    ``,
    input.message,
    ``,
    `Open your inbox to accept and WhatsApp them:`,
    input.inboxUrl,
    ``,
    `Your number stays private until you accept.`,
    ``,
    `— ROLLR`,
    siteUrl(),
  ].join("\n");

  const bodyHtml = [
    mutedP(`Hi ${escapeHtml(input.creatorName)},`),
    mutedP(
      `${strongText(input.clientName)} sent you a brief on ROLLR.`
    ),
    metaLine(meta),
    quoteBlock(input.message),
    mutedP(
      `Accept in Inbox to open WhatsApp to them. Your number stays private until you do.`
    ),
  ].join("");

  const html = emailShell({
    preheader: `${input.clientName} · ${meta}`,
    eyebrow: "New brief",
    title: "Someone wants to hire you",
    bodyHtml,
    cta: { label: "Open inbox → Accept", href: input.inboxUrl },
    secondaryCta: { label: "Go to ROLLR", href: siteUrl() },
    footerNote:
      "You received this because a client sent a brief to your live listing.",
  });

  return { subject, html, text };
}

/** Ops copy when a brief lands (admin nudge) */
export function briefAdminCopyEmail(input: {
  creatorName: string;
  creatorEmail: string;
  clientName: string;
  category: string;
  location: string;
  message: string;
  inboxUrl: string;
}): EmailPayload {
  const subject = `[ROLLR] Brief for ${input.creatorName}: ${input.clientName}`;
  const text = [
    `New brief on ROLLR`,
    `Creator: ${input.creatorName} (${input.creatorEmail})`,
    `Client: ${input.clientName}`,
    `${input.category} · ${input.location}`,
    ``,
    input.message,
    ``,
    `Creator inbox: ${input.inboxUrl}`,
  ].join("\n");

  const bodyHtml = [
    mutedP(`A client sent a brief. Nudge the creator if they miss Inbox.`),
    detailRows([
      { label: "Creator", value: `${input.creatorName} · ${input.creatorEmail}` },
      { label: "Client", value: input.clientName },
      { label: "Details", value: `${input.category} · ${input.location}` },
    ]),
    quoteBlock(input.message),
  ].join("");

  const html = emailShell({
    preheader: `Brief · ${input.creatorName} · ${input.clientName}`,
    eyebrow: "Ops",
    title: "New brief (admin copy)",
    bodyHtml,
    cta: { label: "Creator inbox", href: input.inboxUrl },
    secondaryCta: { label: "Admin", href: `${siteUrl()}/admin` },
  });

  return { subject, html, text };
}

export function waitlistAdminEmail(input: {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  primaryCategory?: string;
  notes?: string;
  adminUrl: string;
}): EmailPayload {
  const subject = `ROLLR waitlist: ${input.role} — ${input.fullName}`;
  const text = [
    `New waitlist signup`,
    ``,
    `Name: ${input.fullName}`,
    `Email: ${input.email}`,
    input.phone ? `Phone: ${input.phone}` : null,
    `Role: ${input.role}`,
    input.primaryCategory ? `Category: ${input.primaryCategory}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
    ``,
    `Review in admin: ${input.adminUrl}`,
    ``,
    `— ROLLR`,
  ]
    .filter(Boolean)
    .join("\n");

  const bodyHtml = [
    mutedP(`Someone registered interest on ROLLR.`),
    detailRows([
      { label: "Name", value: input.fullName },
      { label: "Email", value: input.email },
      { label: "Phone", value: input.phone || "—" },
      { label: "Interest", value: input.role },
      { label: "Category", value: input.primaryCategory || "—" },
      { label: "Notes", value: input.notes || "—" },
    ]),
  ].join("");

  const html = emailShell({
    preheader: `${input.role} · ${input.fullName}`,
    eyebrow: "Waitlist",
    title: "New interest signup",
    bodyHtml,
    cta: { label: "Open admin → Waitlist", href: input.adminUrl },
  });

  return { subject, html, text };
}

export function listingStatusEmail(input: {
  creatorName: string;
  status: "published" | "rejected" | "draft";
  profileUrl?: string;
  studioUrl: string;
}): EmailPayload {
  if (input.status === "published") {
    const subject = "You're live on ROLLR";
    const text = [
      `Hi ${input.creatorName},`,
      ``,
      `Your portfolio was approved and is now live on ROLLR.`,
      input.profileUrl ? `Profile: ${input.profileUrl}` : null,
      `Update anytime: ${input.studioUrl}`,
      ``,
      `Clients can send you briefs from your profile. Check Inbox regularly — and WhatsApp them after you accept.`,
      ``,
      `— ROLLR`,
      siteUrl(),
    ]
      .filter(Boolean)
      .join("\n");

    const bodyHtml = [
      mutedP(`Hi ${escapeHtml(input.creatorName)},`),
      mutedP(
        `Your portfolio was ${strongText("approved")} and is live on the Mumbai directory.`
      ),
      mutedP(
        `Clients can send briefs from your profile. Accept in Inbox, then WhatsApp them. 0% commission on the job.`
      ),
    ].join("");

    const html = emailShell({
      preheader: "Your portfolio is live on ROLLR",
      eyebrow: "Listing",
      title: "You're live on ROLLR",
      bodyHtml,
      cta: input.profileUrl
        ? { label: "View public profile", href: input.profileUrl }
        : { label: "Open portfolio editor", href: input.studioUrl },
      secondaryCta: input.profileUrl
        ? { label: "Edit portfolio", href: input.studioUrl }
        : { label: "Browse directory", href: siteUrl() },
      footerNote: "You received this because your listing status changed.",
    });

    return { subject, html, text };
  }

  if (input.status === "rejected") {
    const subject = "ROLLR listing needs a few changes";
    const text = [
      `Hi ${input.creatorName},`,
      ``,
      `Your listing wasn't published yet. Please update portfolio quality (photos, bio, areas, prices) and submit again:`,
      input.studioUrl,
      ``,
      `— ROLLR`,
    ].join("\n");

    const bodyHtml = [
      mutedP(`Hi ${escapeHtml(input.creatorName)},`),
      mutedP(
        `Thanks for submitting. We’re not publishing yet — strengthen portfolio stills, bio, areas, and package floors, then submit again.`
      ),
    ].join("");

    const html = emailShell({
      preheader: "Update your portfolio and resubmit",
      eyebrow: "Listing review",
      title: "A few tweaks needed",
      bodyHtml,
      cta: { label: "Edit portfolio", href: input.studioUrl },
      footerNote: "You received this because your listing was reviewed.",
    });

    return { subject, html, text };
  }

  const subject = "ROLLR listing set to draft";
  const text = `Hi ${input.creatorName},\n\nYour listing is back in draft. Edit and resubmit: ${input.studioUrl}\n\n— ROLLR`;
  const bodyHtml = [
    mutedP(`Hi ${escapeHtml(input.creatorName)},`),
    mutedP(
      `Your listing is in draft and not shown on the public directory. Edit and submit for review when ready.`
    ),
  ].join("");

  const html = emailShell({
    preheader: "Listing moved to draft",
    eyebrow: "Listing",
    title: "Back to draft",
    bodyHtml,
    cta: { label: "Open portfolio editor", href: input.studioUrl },
  });

  return { subject, html, text };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
