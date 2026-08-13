import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone, Share, MoreVertical, PlusSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Use ROLLR on your phone",
  description:
    "Add ROLLR to your iPhone or Android home screen — no App Store download.",
};

const iphoneSteps = [
  {
    title: "Open in Safari",
    body: "Use Safari (not Chrome or Instagram’s in-app browser). Paste your ROLLR link and load the site.",
  },
  {
    title: "Tap Share",
    body: "The square-with-arrow icon at the bottom of Safari (or top on some iPads).",
  },
  {
    title: "Add to Home Screen",
    body: "Scroll the share sheet and tap “Add to Home Screen”. Name it ROLLR → Add.",
  },
  {
    title: "Open from your home screen",
    body: "The icon works like a shortcut to the full site — inbox, briefs, and tools on the go.",
  },
];

const androidSteps = [
  {
    title: "Open in Chrome",
    body: "Use Chrome (or your default browser). Open the ROLLR website.",
  },
  {
    title: "Open the menu",
    body: "Tap the three dots ⋮ in the top-right corner.",
  },
  {
    title: "Add to Home screen",
    body: "Choose “Add to Home screen” or “Install app” if you see it. Confirm.",
  },
  {
    title: "Launch from the icon",
    body: "Same ROLLR experience — no Play Store install required.",
  },
];

export default function InstallPage() {
  return (
    <div className="bg-grid-fade">
      <div className="page-shell max-w-3xl space-y-10 py-8 sm:py-12">
        <div className="space-y-3">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
            Mobile
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Use ROLLR on your phone
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-white/45">
            ROLLR is a website that works in your browser. For a faster app-like
            shortcut, add it to your home screen — no App Store or Play Store
            download.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="surface-panel space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Share className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-white">iPhone</h2>
                <p className="text-xs text-white/40">Safari only</p>
              </div>
            </div>
            <ol className="space-y-4">
              {iphoneSteps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold tabular-nums text-white/50">
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-white/90">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/40">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/30">
              <PlusSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              If you don’t see “Add to Home Screen”, you’re probably not in
              Safari — open the link in Safari first.
            </p>
          </section>

          <section className="surface-panel space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MoreVertical className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-white">Android</h2>
                <p className="text-xs text-white/40">Chrome recommended</p>
              </div>
            </div>
            <ol className="space-y-4">
              {androidSteps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold tabular-nums text-white/50">
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-white/90">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/40">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/30">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Menu labels vary slightly by phone brand — look for “Home screen”
              or “Install”.
            </p>
          </section>
        </div>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
          <div className="flex gap-3">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-2 text-sm text-white/45">
              <p className="font-medium text-white/90">What you get</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>One-tap access to browse, briefs, inbox, and tools</li>
                <li>Same account as desktop — sign in once on the phone</li>
                <li>No app store review or update wait</li>
              </ul>
              <p className="text-xs text-white/30">
                This is a home-screen shortcut to the website — not a separate
                App Store app. A fuller installable web app can come later with
                your own domain.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="font-semibold">
            <Link href="/">Browse creators</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup?role=creator&next=/studio">List free</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/guides/clients">Client guide</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
