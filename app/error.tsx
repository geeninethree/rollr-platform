"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[rollr] route error:", error);
  }, [error]);

  return (
    <div className="bg-grid-fade">
      <div className="page-shell flex max-w-lg flex-col items-center py-28 text-center">
        <p className="text-overline text-primary">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          We hit a snag
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again, or head back to the directory. If this keeps happening,
          refresh the page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button className="font-semibold" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Discover creators</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
