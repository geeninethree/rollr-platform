import type { DeliveryNote } from "@/lib/delivery-notes";
import { PrintDocShell } from "@/components/docs/print-shell";

export function DeliveryDocument({ note }: { note: DeliveryNote }) {
  return (
    <PrintDocShell
      kicker="Delivery note"
      number={note.note_number}
      dateLine={`Issued ${note.issue_date}${
        note.delivery_date ? ` · Delivered ${note.delivery_date}` : ""
      }`}
      status={note.status}
    >
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
            From
          </p>
          <p className="mt-2 text-sm font-semibold">{note.creator_name}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
            Client
          </p>
          <p className="mt-2 text-sm font-semibold">{note.client_name}</p>
          {note.client_email && (
            <p className="text-xs text-[#6b6560]">{note.client_email}</p>
          )}
          {note.client_phone && (
            <p className="text-xs text-[#6b6560]">{note.client_phone}</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
          Project
        </p>
        <p className="mt-1 text-base font-semibold">{note.project_title}</p>
      </div>

      <table className="mt-8 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#e8e4dc] text-[11px] uppercase tracking-wide text-[#6b6560]">
            <th className="py-2 pr-2 font-semibold">Item</th>
            <th className="py-2 px-2 font-semibold text-right">Qty</th>
            <th className="py-2 pl-2 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {note.items.map((it, i) => (
            <tr key={i} className="border-b border-[#f0ebe3]">
              <td className="py-3 pr-2">{it.description}</td>
              <td className="py-3 px-2 text-right tabular-nums text-[#6b6560]">
                {it.quantity}
              </td>
              <td className="py-3 pl-2 text-xs text-[#6b6560]">
                {it.notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {note.access_note && (
        <p className="mt-8 text-xs text-[#6b6560]">
          <span className="font-semibold text-[#0a0a0b]">Access / links: </span>
          {note.access_note}
        </p>
      )}
      {note.notes && (
        <p className="mt-3 text-xs text-[#6b6560]">
          <span className="font-semibold text-[#0a0a0b]">Notes: </span>
          {note.notes}
        </p>
      )}
    </PrintDocShell>
  );
}
