import Link from "next/link";
import { JobCard } from "@/components/job-board/job-card";
import { Button } from "@/components/ui/button";
import { MOCK_JOBS } from "@/lib/mock-data";

export const metadata = {
  title: "Job Board",
  description:
    "Open shoot and edit briefs for Mumbai creators. Pitch free, chat after accept.",
};

export default function JobBoardPage() {
  const jobs = [...MOCK_JOBS].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
              Shoot, edit, and full-package briefs. Creators pitch free; contact
              stays protected until there&apos;s a mutual fit.
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

        <div className="mb-6 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {jobs.length} open briefs
          </span>
          {" · "}
          Includes edit-only posts. Pitch is demo-local for now.
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}
