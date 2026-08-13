import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** White printable card shell used by all creator documents. */
export function PrintDocShell({
  children,
  className,
  kicker = "Document",
  number,
  dateLine,
  status,
}: {
  children: ReactNode;
  className?: string;
  kicker?: string;
  number?: string;
  dateLine?: string;
  status?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-[720px] bg-white text-[#0a0a0b]",
        className
      )}
    >
      <div className="border border-[#e8e4dc] p-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e8e4dc] pb-6">
          <div>
            <p
              className="text-lg font-semibold tracking-[0.2em]"
              style={{ letterSpacing: "0.18em" }}
            >
              R<span style={{ color: "#C9A84C" }}>◎</span>LLR
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-[#6b6560]">
              Creator document · Mumbai
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b6560]">
              {kicker}
            </p>
            {number && (
              <p className="mt-1 font-mono text-base font-semibold">{number}</p>
            )}
            {dateLine && (
              <p className="mt-2 text-xs text-[#6b6560]">{dateLine}</p>
            )}
            {status && (
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#C9A84C]">
                {status}
              </p>
            )}
          </div>
        </div>
        {children}
        <p className="mt-10 text-[10px] leading-relaxed text-[#9a9690]">
          This document is issued by the creator. ROLLR is a directory platform
          and is not a party to the engagement, does not collect payment, and is
          not responsible for tax compliance.
        </p>
      </div>
    </div>
  );
}
