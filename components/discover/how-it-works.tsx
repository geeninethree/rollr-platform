import Link from "next/link";
import { CheckCircle2, FileText, MessageCircle, Sparkles } from "lucide-react";

const clientSteps = [
  { icon: FileText, title: "Browse & open a profile", body: "Filter by area and category." },
  { icon: CheckCircle2, title: "Send a brief", body: "They accept if it’s a fit." },
  { icon: MessageCircle, title: "They WhatsApp you", body: "Book direct. 0% fee." },
];

const creatorSteps = [
  { icon: Sparkles, title: "Build portfolio + list ₹299", body: "Works on ROLLR + optional links." },
  { icon: FileText, title: "Get qualified briefs", body: "Review before sharing contact." },
  { icon: MessageCircle, title: "You message the client", body: "Keep 100% of the job." },
];

export function HowItWorks() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
        <h2 className="text-sm font-semibold tracking-tight">For clients</h2>
        <ol className="mt-3 space-y-3">
          {clientSteps.map((step, i) => (
            <li key={step.title} className="flex gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">For creators</h2>
          <Link
            href="/studio"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Portfolio →
          </Link>
        </div>
        <ol className="mt-3 space-y-3">
          {creatorSteps.map((step, i) => (
            <li key={step.title} className="flex gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
