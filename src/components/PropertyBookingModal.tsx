import {
  Calendar,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  AMENITY_LABELS,
  FOOD_POLICY_LABELS,
  VERIFICATION_TIER_LABELS,
} from '../data/locusData';
import type {
  BookingKind,
  BookingRequest,
  PGProperty,
  SharingType,
  StudentProfile,
} from '../types/locus';
import { computeBookingEstimate, formatINR } from '../utils/housingLogic';

interface PropertyBookingModalProps {
  property: PGProperty | null;
  studentProfile: StudentProfile;
  onClose: () => void;
  onBookingCreated: (booking: BookingRequest, updatedProperty?: PGProperty) => void;
  onViewBookings: () => void;
}

const VISIT_SLOTS = [
  'Tomorrow, 11:00 AM',
  'Tomorrow, 4:00 PM',
  'This Weekend, 10:30 AM',
  'This Weekend, 3:00 PM',
];

export function PropertyBookingModal({
  property,
  studentProfile,
  onClose,
  onBookingCreated,
  onViewBookings,
}: PropertyBookingModalProps) {
  const [selectedSharing, setSelectedSharing] = useState<SharingType>(
    property?.roomOptions[0]?.sharing ?? '2-Sharing',
  );
  const [bookingKind, setBookingKind] = useState<BookingKind>('reserve_bed');
  const [studentName, setStudentName] = useState(studentProfile.fullName || '');
  const [studentEmail, setStudentEmail] = useState(studentProfile.email || '');
  const [studentPhone, setStudentPhone] = useState(studentProfile.phone || '');
  const [moveInDate, setMoveInDate] = useState(
    studentProfile.expectedMoveIn || '2026-12-01',
  );
  const [visitSlot, setVisitSlot] = useState(VISIT_SLOTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRequest | null>(null);

  if (!property) return null;

  const activeSharing = property.roomOptions.some((r) => r.sharing === selectedSharing)
    ? selectedSharing
    : property.roomOptions[0]?.sharing ?? '2-Sharing';

  const estimate = computeBookingEstimate(property, activeSharing);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentName.trim() || studentName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!studentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim())) {
      setError('Please enter a valid student email address.');
      return;
    }
    if (studentPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!moveInDate) {
      setError('Please select a move-in date.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim(),
          studentPhone: studentPhone.trim(),
          sharing: activeSharing,
          moveInDate,
          visitSlot: bookingKind === 'schedule_visit' ? visitSlot : undefined,
          kind: bookingKind,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not complete your booking request.');
        return;
      }
      setConfirmedBooking(data.booking);
      onBookingCreated(data.booking, data.property);
    } catch {
      setError('Network error while submitting booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-3 sm:p-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 ${
                  property.verificationTier === 'college_owned'
                    ? 'font-bold text-[#36338B]'
                    : property.verificationTier === 'college_verified'
                      ? 'font-bold text-emerald-800'
                      : 'font-semibold text-slate-600'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{VERIFICATION_TIER_LABELS[property.verificationTier]}</span>
              </span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-600 tabular-nums">Audit {property.auditScore}/100</span>
            </div>
            <h2 id="booking-modal-title" className="truncate text-lg font-bold text-slate-900">
              {property.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close property details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {confirmedBooking ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
              <CheckCircle2
                className="mx-auto h-12 w-12 text-emerald-700"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {confirmedBooking.kind === 'reserve_bed'
                  ? 'Bed Reservation Confirmed'
                  : 'Campus Visit Scheduled'}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Booking Reference{' '}
                <span className="font-mono font-bold text-slate-900">
                  {confirmedBooking.id.toUpperCase()}
                </span>
              </p>

              <div className="mt-5 space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 text-left text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Property</span>
                  <span className="font-semibold text-slate-900">
                    {confirmedBooking.propertyName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Occupancy</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.sharing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatINR(confirmedBooking.monthlyRent)}/mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Brokerage Fee</span>
                  <span className="font-semibold text-emerald-700">₹0 (Zero Brokerage)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {confirmedBooking.kind === 'reserve_bed' ? 'Move-In Date' : 'Visit Slot'}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {confirmedBooking.kind === 'reserve_bed'
                      ? confirmedBooking.moveInDate
                      : confirmedBooking.visitSlot}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewBookings();
                  }}
                  className="h-11 rounded-xl bg-[#36338B] px-5 text-sm font-semibold text-white hover:bg-[#29266E] cursor-pointer"
                >
                  View My Bookings
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Back to Map
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Property Info */}
              <div className="space-y-5 lg:col-span-6">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img
                    src={property.imageUrl}
                    alt={property.name}
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>

                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-[#36338B]" aria-hidden="true" />
                    {property.address} · {property.distanceMeters}m from {property.gateLabel}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Curfew &amp; Access:</span>{' '}
                    {property.curfewPolicy}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                    <Utensils className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>
                      {property.foodPolicy.map((f) => FOOD_POLICY_LABELS[f]).join(' · ')}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                    Highlights
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    {property.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-[#36338B]" aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                    Included Amenities
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {property.amenities.map((a) => AMENITY_LABELS[a]).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Right Booking Configurator */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4 lg:col-span-6">
                <div>
                  <span className="block text-xs font-bold tracking-wide text-slate-700 uppercase">
                    1. Select Room Occupancy
                  </span>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {property.roomOptions.map((opt) => {
                      const active = activeSharing === opt.sharing;
                      return (
                        <button
                          key={opt.sharing}
                          type="button"
                          onClick={() => setSelectedSharing(opt.sharing)}
                          aria-pressed={active}
                          className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                            active
                              ? 'border-[#36338B] bg-[#36338B]/[0.06] ring-1 ring-[#36338B]'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900">{opt.sharing}</p>
                          <p className="mt-0.5 font-mono text-sm font-bold text-[#36338B] tabular-nums">
                            {formatINR(opt.monthlyRent)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {opt.bedsLeft} {opt.bedsLeft === 1 ? 'bed' : 'beds'} left
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold tracking-wide text-slate-700 uppercase">
                    2. Booking Mode
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setBookingKind('reserve_bed')}
                      className={`h-10 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        bookingKind === 'reserve_bed'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Reserve Bed Instantly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingKind('schedule_visit')}
                      className={`h-10 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        bookingKind === 'schedule_visit'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Schedule Visit First
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bk-name" className="block text-xs font-semibold text-slate-700">
                      Student Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="bk-name"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Full name"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-[#36338B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="bk-phone" className="block text-xs font-semibold text-slate-700">
                      Mobile Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="bk-phone"
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="+91 98450 00000"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-[#36338B] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bk-email" className="block text-xs font-semibold text-slate-700">
                      Student Email <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="bk-email"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-[#36338B] focus:outline-none"
                    />
                  </div>

                  {bookingKind === 'reserve_bed' ? (
                    <div>
                      <label htmlFor="bk-date" className="block text-xs font-semibold text-slate-700">
                        Move-In Date <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="bk-date"
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-[#36338B] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="bk-slot" className="block text-xs font-semibold text-slate-700">
                        Preferred Visit Slot
                      </label>
                      <select
                        id="bk-slot"
                        value={visitSlot}
                        onChange={(e) => setVisitSlot(e.target.value)}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-[#36338B] focus:outline-none"
                      >
                        {VISIT_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Transparent Pricing Summary */}
                <div className="rounded-xl border border-slate-200 bg-[#F8F9FC] p-4 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Monthly Rent ({activeSharing})</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatINR(estimate.monthlyRent)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-slate-600">
                    <span>Refundable Security Deposit</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatINR(estimate.deposit)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-emerald-700 font-semibold">
                    <span>LOCUS Brokerage Fee</span>
                    <span className="tabular-nums">
                      ₹0 (Saved {formatINR(estimate.brokerageSaved)})
                    </span>
                  </div>
                  <div className="mt-2.5 flex justify-between border-t border-slate-200 pt-2.5 text-sm font-bold text-slate-900">
                    <span>Total Due at Move-In</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(estimate.totalMoveInDue)}
                    </span>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-rose-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36338B] px-5 text-sm font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {submitting
                      ? 'Submitting...'
                      : bookingKind === 'reserve_bed'
                        ? `Confirm Bed Reservation · ${formatINR(estimate.monthlyRent)}/mo`
                        : 'Schedule Free Campus Visit'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
