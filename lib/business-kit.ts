/**
 * Public marketing copy for creator business tools.
 * Used on /tools (teaser), /list, guides — keep in sync with real routes.
 */

export type BusinessKitTool = {
  href: string;
  title: string;
  desc: string;
  /** One-line pitch for marketing cards */
  pitch: string;
  /** Needs signed-in creator to use */
  authRequired: boolean;
};

export const BUSINESS_KIT_TOOLS: BusinessKitTool[] = [
  {
    href: "/quotes",
    title: "Quotes",
    desc: "Estimates before the job",
    pitch: "Line items + GST · shareable link · print/PDF",
    authRequired: true,
  },
  {
    href: "/bookings",
    title: "Booking confirmations",
    desc: "Date, package, deposit, terms",
    pitch: "Lock the date with deposit & terms — share a link",
    authRequired: true,
  },
  {
    href: "/invoices",
    title: "Invoices",
    desc: "Bill clients, share link, mark paid",
    pitch: "Prefill from briefs · payment reminders · you stay the seller",
    authRequired: true,
  },
  {
    href: "/rate-cards",
    title: "Rate cards",
    desc: "Public package pricing sheet",
    pitch: "Share packages on Insta or with clients — no more “rate pls” chaos",
    authRequired: true,
  },
  {
    href: "/delivery",
    title: "Delivery notes",
    desc: "Handover checklist for clients",
    pitch: "Selects, reels, drive links — clear handover",
    authRequired: true,
  },
  {
    href: "/clients",
    title: "Client folder",
    desc: "All history per client",
    pitch: "Briefs · quotes · bookings · invoices · delivery in one place",
    authRequired: true,
  },
  {
    href: "/earnings",
    title: "Earnings / GST",
    desc: "Year summary + CSV export",
    pitch: "Paid totals + GST on paid invoices · CSV for your books",
    authRequired: true,
  },
  {
    href: "/inbox",
    title: "Inbox",
    desc: "Accept briefs · open WhatsApp",
    pitch: "Accept / decline · then WhatsApp the client (number stays private)",
    authRequired: true,
  },
];

export const BUSINESS_KIT_BULLETS = [
  "Quotes & estimates (shareable, printable)",
  "Booking confirmations (date, deposit, terms)",
  "Invoices + WhatsApp payment reminders",
  "Public rate cards for packages",
  "Delivery notes when you hand over work",
  "Client folder (full history per person)",
  "Year earnings / GST summary + CSV",
];
