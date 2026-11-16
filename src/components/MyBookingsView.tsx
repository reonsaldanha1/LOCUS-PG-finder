import { Calendar, CheckCircle2, Compass, XCircle } from 'lucide-react';
import type { BookingRequest } from '../types/locus';
import { formatINR } from '../utils/housingLogic';

interface MyBookingsViewProps {
  bookings: BookingRequest[];
  onCancelBooking: (bookingId: string) => void;
  onExplorePGs: () => void;
}

export function MyBookingsView({
  bookings,
  onCancelBooking,
  onExplorePGs,
}: MyBookingsViewProps) {
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Bookings &amp; Scheduled Visits
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your direct zero-brokerage bed reservations and campus tour appointments.
          </p>
        </div>
        <button
          type="button"
          onClick={onExplorePGs}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#36338B] px-5 text-xs font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          Browse Campus Map
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-3 text-base font-bold text-slate-900">No bookings yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Explore verified PGs on the interactive campus map and reserve a bed or schedule a tour.
          </p>
          <button
            type="button"
            onClick={onExplorePGs}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#36338B] px-5 text-sm font-semibold text-white hover:bg-[#29266E] cursor-pointer"
          >
            Find Student Housing
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((bk) => {
            const isCancelled = bk.status === 'cancelled';
            return (
              <article
                key={bk.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-500">
                      {bk.id.toUpperCase()}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-semibold text-[#36338B]">{bk.collegeCode}</span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    {bk.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Confirmed Reservation
                      </span>
                    )}
                    {bk.status === 'visit_scheduled' && (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        Visit Scheduled ({bk.visitSlot || 'Upcoming'})
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Cancelled
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{bk.propertyName}</h2>
                  <p className="text-xs text-slate-600">
                    Student: <span className="font-medium text-slate-800">{bk.studentName}</span> ·{' '}
                    {bk.sharing} · Move-in {bk.moveInDate}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                      {formatINR(bk.monthlyRent)}/mo
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      Deposit {formatINR(bk.deposit)} · ₹0 Brokerage
                    </p>
                  </div>

                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() => onCancelBooking(bk.id)}
                      className="h-10 rounded-lg border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
