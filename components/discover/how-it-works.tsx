import Link from "next/link";

const clientSteps = [
  {
    title: "Browse",
    body: "Filter by area and category — portfolio & package floors.",
  },
  {
    title: "Send a brief",
    body: "Your WhatsApp + what you need. No public phone hunt.",
  },
  {
    title: "They message you",
    body: "If it’s a fit, they WhatsApp you. Book direct — 0%.",
  },
];

const creatorSteps = [
  {
    title: "List free",
    body: "Build portfolio on ROLLR. Alpha listing is free.",
  },
  {
    title: "Get briefs",
    body: "Review each request in Inbox before you reply.",
  },
  {
    title: "You message the client",
    body: "Keep 100% of the job. Your number stays private.",
  },
  {
    title: "Quote · invoice · deliver",
    body: "Business kit: estimates, bookings, invoices, rate cards, delivery notes.",
  },
];

export function HowItWorks() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="surface-panel p-5 sm:p-6">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/35">
          For clients
        </h2>
        <ol className="mt-5 space-y-4">
          {clientSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold tabular-nums text-white/50">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-white/90">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-white/40">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="surface-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/35">
            For creators
          </h2>
          <Link
            href="/signup?role=creator&next=/studio"
            className="text-xs font-medium text-white/50 transition-colors hover:text-white"
          >
            Start →
          </Link>
        </div>
        <ol className="mt-5 space-y-4">
          {creatorSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold tabular-nums text-white/50">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-white/90">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-white/40">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/tools"
          className="mt-5 inline-block text-xs font-medium text-primary transition-colors hover:underline"
        >
          Preview business kit (no signup required) →
        </Link>
      </div>
    </section>
  );
}
