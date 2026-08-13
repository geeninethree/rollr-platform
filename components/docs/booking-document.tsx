import type { Booking } from "@/lib/bookings";
import { formatBookingMoney } from "@/lib/bookings";
import { PrintDocShell } from "@/components/docs/print-shell";

export function BookingDocument({ booking }: { booking: Booking }) {
  return (
    <PrintDocShell
      kicker="Booking confirmation"
      number={booking.booking_number}
      dateLine={`Issued ${booking.issue_date}`}
      status={booking.status}
    >
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
            Creator
          </p>
          <p className="mt-2 text-sm font-semibold">{booking.creator_name}</p>
          {booking.creator_email && (
            <p className="text-xs text-[#6b6560]">{booking.creator_email}</p>
          )}
          {booking.creator_phone && (
            <p className="text-xs text-[#6b6560]">{booking.creator_phone}</p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
            Client
          </p>
          <p className="mt-2 text-sm font-semibold">{booking.client_name}</p>
          {booking.client_email && (
            <p className="text-xs text-[#6b6560]">{booking.client_email}</p>
          )}
          {booking.client_phone && (
            <p className="text-xs text-[#6b6560]">{booking.client_phone}</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-[#e8e4dc] bg-[#faf8f5] p-5">
        <p className="text-base font-semibold">{booking.package_title}</p>
        {booking.package_description && (
          <p className="mt-2 text-sm text-[#6b6560]">
            {booking.package_description}
          </p>
        )}
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {booking.event_date && (
            <div>
              <dt className="text-[11px] uppercase text-[#6b6560]">Date</dt>
              <dd className="font-medium">
                {booking.event_date}
                {booking.event_time ? ` · ${booking.event_time}` : ""}
              </dd>
            </div>
          )}
          {booking.location && (
            <div>
              <dt className="text-[11px] uppercase text-[#6b6560]">Location</dt>
              <dd className="font-medium">{booking.location}</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] uppercase text-[#6b6560]">Deposit</dt>
            <dd className="font-medium tabular-nums text-[#C9A84C]">
              {formatBookingMoney(booking.deposit_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-[#6b6560]">Total</dt>
            <dd className="font-medium tabular-nums">
              {formatBookingMoney(booking.total_amount)}
            </dd>
          </div>
        </dl>
      </div>

      {booking.terms && (
        <div className="mt-8 border-t border-[#e8e4dc] pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6560]">
            Terms
          </p>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[#6b6560]">
            {booking.terms}
          </p>
        </div>
      )}

      {booking.notes && (
        <p className="mt-6 text-xs text-[#6b6560]">
          <span className="font-semibold text-[#0a0a0b]">Notes: </span>
          {booking.notes}
        </p>
      )}
    </PrintDocShell>
  );
}
