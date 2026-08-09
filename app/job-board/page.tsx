import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Job Board",
  description:
    "Post open shoot and edit briefs for Mumbai creators. Pitch free, chat after accept.",
};

export default function JobBoardPage() {
  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Open briefs
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Job board</h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Don&apos;t want to pick a creator yet? Post a brief here and let
              photographers and editors pitch. Contact stays protected until
              there&apos;s a mutual fit.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Find shooters</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/editors">Find editors</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-base font-medium text-foreground">
            No open briefs yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Public job posts aren&apos;t live yet. For now, open a creator
            profile and use <strong className="text-foreground">Send brief</strong>{" "}
            — they accept and WhatsApp you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild className="font-semibold">
              <Link href="/">Browse photographers</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/editors">Browse editors</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
