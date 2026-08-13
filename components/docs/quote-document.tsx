import type { Quote } from "@/lib/quotes";
import { formatQuoteMoney } from "@/lib/quotes";
import { PrintDocShell } from "@/components/docs/print-shell";

export function QuoteDocument({ quote }: { quote: Quote }) {
  return (
    <PrintDocShell
      kicker="Quote"
      number={quote.quote_number}
      dateLine={`Issued ${quote.issue_date}${
        quote.valid_until ? ` · Valid until ${quote.valid_until}` : ""
      }`}
      status={quote.status}
    >
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
            From
          </p>
          <p className="mt-2 text-sm font-semibold">{quote.seller_name}</p>
          {quote.seller_email && (
            <p className="text-xs text-[#6b6560]">{quote.seller_email}</p>
          )}
          {quote.seller_phone && (
            <p className="text-xs text-[#6b6560]">{quote.seller_phone}</p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
            For
          </p>
          <p className="mt-2 text-sm font-semibold">{quote.client_name}</p>
          {quote.client_email && (
            <p className="text-xs text-[#6b6560]">{quote.client_email}</p>
          )}
          {quote.client_phone && (
            <p className="text-xs text-[#6b6560]">{quote.client_phone}</p>
          )}
        </div>
      </div>

      <table className="mt-10 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#e8e4dc] text-[11px] uppercase tracking-wide text-[#6b6560]">
            <th className="py-2 pr-2 font-semibold">Description</th>
            <th className="py-2 px-2 font-semibold text-right">Qty</th>
            <th className="py-2 px-2 font-semibold text-right">Rate</th>
            <th className="py-2 pl-2 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quote.line_items.map((li, i) => (
            <tr key={i} className="border-b border-[#f0ebe3]">
              <td className="py-3 pr-2">{li.description}</td>
              <td className="py-3 px-2 text-right tabular-nums text-[#6b6560]">
                {li.quantity}
              </td>
              <td className="py-3 px-2 text-right tabular-nums text-[#6b6560]">
                {formatQuoteMoney(li.unit_amount)}
              </td>
              <td className="py-3 pl-2 text-right font-medium tabular-nums">
                {formatQuoteMoney(li.quantity * li.unit_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-[#6b6560]">
            <span>Subtotal</span>
            <span className="tabular-nums">
              {formatQuoteMoney(quote.subtotal)}
            </span>
          </div>
          {quote.gst_percent > 0 && (
            <div className="flex justify-between text-[#6b6560]">
              <span>GST ({quote.gst_percent}%)</span>
              <span className="tabular-nums">
                {formatQuoteMoney(quote.gst_amount)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-[#e8e4dc] pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums text-[#C9A84C]">
              {formatQuoteMoney(quote.total)}
            </span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <p className="mt-8 border-t border-[#e8e4dc] pt-6 text-xs text-[#6b6560]">
          <span className="font-semibold text-[#0a0a0b]">Notes: </span>
          {quote.notes}
        </p>
      )}
    </PrintDocShell>
  );
}
