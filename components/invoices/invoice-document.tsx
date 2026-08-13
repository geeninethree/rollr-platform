import type { Invoice } from "@/lib/invoices";
import { formatInvoiceMoney } from "@/lib/invoices";
import { cn } from "@/lib/utils";

type InvoiceDocumentProps = {
  invoice: Invoice;
  className?: string;
};

/** Printable invoice layout — use with window.print() / Save as PDF */
export function InvoiceDocument({ invoice, className }: InvoiceDocumentProps) {
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
              Creator invoice · Mumbai
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b6560]">
              Invoice
            </p>
            <p className="mt-1 font-mono text-base font-semibold">
              {invoice.invoice_number}
            </p>
            <p className="mt-2 text-xs text-[#6b6560]">
              Issued {invoice.issue_date}
              {invoice.due_date ? ` · Due ${invoice.due_date}` : ""}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#C9A84C]">
              {invoice.status}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
              From
            </p>
            <p className="mt-2 text-sm font-semibold">{invoice.seller_name}</p>
            {invoice.seller_email && (
              <p className="text-xs text-[#6b6560]">{invoice.seller_email}</p>
            )}
            {invoice.seller_phone && (
              <p className="text-xs text-[#6b6560]">{invoice.seller_phone}</p>
            )}
            {invoice.seller_gstin && (
              <p className="text-xs text-[#6b6560]">
                GSTIN {invoice.seller_gstin}
              </p>
            )}
            {invoice.seller_address && (
              <p className="mt-1 text-xs text-[#6b6560]">
                {invoice.seller_address}
              </p>
            )}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
              Bill to
            </p>
            <p className="mt-2 text-sm font-semibold">{invoice.client_name}</p>
            {invoice.client_email && (
              <p className="text-xs text-[#6b6560]">{invoice.client_email}</p>
            )}
            {invoice.client_phone && (
              <p className="text-xs text-[#6b6560]">{invoice.client_phone}</p>
            )}
            {invoice.client_address && (
              <p className="mt-1 text-xs text-[#6b6560]">
                {invoice.client_address}
              </p>
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
            {invoice.line_items.map((li, i) => (
              <tr key={i} className="border-b border-[#f0ebe3]">
                <td className="py-3 pr-2 text-[#0a0a0b]">{li.description}</td>
                <td className="py-3 px-2 text-right tabular-nums text-[#6b6560]">
                  {li.quantity}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-[#6b6560]">
                  {formatInvoiceMoney(li.unit_amount)}
                </td>
                <td className="py-3 pl-2 text-right font-medium tabular-nums">
                  {formatInvoiceMoney(li.quantity * li.unit_amount)}
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
                {formatInvoiceMoney(invoice.subtotal)}
              </span>
            </div>
            {invoice.gst_percent > 0 && (
              <div className="flex justify-between text-[#6b6560]">
                <span>GST ({invoice.gst_percent}%)</span>
                <span className="tabular-nums">
                  {formatInvoiceMoney(invoice.gst_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#e8e4dc] pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-[#C9A84C]">
                {formatInvoiceMoney(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {(invoice.payment_note || invoice.notes) && (
          <div className="mt-8 space-y-3 border-t border-[#e8e4dc] pt-6 text-xs text-[#6b6560]">
            {invoice.payment_note && (
              <p>
                <span className="font-semibold text-[#0a0a0b]">Payment: </span>
                {invoice.payment_note}
              </p>
            )}
            {invoice.notes && (
              <p>
                <span className="font-semibold text-[#0a0a0b]">Notes: </span>
                {invoice.notes}
              </p>
            )}
          </div>
        )}

        <p className="mt-10 text-[10px] leading-relaxed text-[#9a9690]">
          This invoice is issued by the creator above. ROLLR is a directory
          platform and is not a party to this engagement, does not collect
          payment, and is not responsible for tax compliance. Verify bank/UPI
          details with the creator directly.
        </p>
      </div>
    </div>
  );
}
