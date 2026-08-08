import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-grid-fade">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          That route doesn&apos;t exist on ROLLR. Head back to Discover or try
          the editors directory.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild className="font-semibold">
            <Link href="/">Discover shooters</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/editors">Editors</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/job-board">Job board</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
