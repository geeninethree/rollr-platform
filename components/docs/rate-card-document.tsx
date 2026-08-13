import type { RateCard } from "@/lib/rate-cards";
import { formatRateMoney } from "@/lib/rate-cards";
import { PrintDocShell } from "@/components/docs/print-shell";

export function RateCardDocument({ card }: { card: RateCard }) {
  return (
    <PrintDocShell kicker={card.title || "Rate card"} status={card.status}>
      <div className="mt-8">
        <p className="text-xl font-semibold">{card.creator_name}</p>
        {card.creator_tagline && (
          <p className="mt-1 text-sm text-[#6b6560]">{card.creator_tagline}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6b6560]">
          {card.creator_email && <span>{card.creator_email}</span>}
          {card.creator_phone && <span>{card.creator_phone}</span>}
        </div>
      </div>

      <ul className="mt-10 space-y-4">
        {card.packages.map((pkg, i) => (
          <li
            key={i}
            className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0ebe3] pb-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{pkg.name}</p>
              {pkg.description && (
                <p className="mt-1 text-sm text-[#6b6560]">{pkg.description}</p>
              )}
              {pkg.unit && (
                <p className="mt-1 text-[11px] uppercase tracking-wide text-[#9a9690]">
                  {pkg.unit}
                </p>
              )}
            </div>
            <p className="shrink-0 text-base font-semibold tabular-nums text-[#C9A84C]">
              {pkg.price > 0 ? `From ${formatRateMoney(pkg.price)}` : "On request"}
            </p>
          </li>
        ))}
      </ul>

      {card.notes && (
        <p className="mt-8 text-xs leading-relaxed text-[#6b6560]">
          {card.notes}
        </p>
      )}
    </PrintDocShell>
  );
}
