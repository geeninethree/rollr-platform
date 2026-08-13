import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Home / directory callout — how to put ROLLR on the home screen. */
export function InstallOnPhoneBand() {
  return (
    <section className="surface-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-white">
            Use ROLLR like an app on your phone
          </p>
          <p className="text-sm leading-relaxed text-white/40">
            Add to Home Screen on iPhone (Safari) or Android (Chrome) — no App
            Store download. One tap to inbox, briefs, and tools.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="w-full shrink-0 sm:w-auto">
        <Link href="/install">See steps →</Link>
      </Button>
    </section>
  );
}
