import { ArrowRight, Check, Lock, Radar, ShieldCheck, Wallet } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type {
  AccommodationInterest,
  BudgetTier,
  GenderOption,
  StudentProfile,
} from '../types/locus';
import { validateStep1Profile } from '../utils/housingLogic';

interface Step1ProfileProps {
  profile: StudentProfile;
  onChange: (next: StudentProfile) => void;
  onContinue: () => void;
}

const GENDERS: GenderOption[] = ['Male', 'Female', 'Other'];
const ACCOMMODATION_OPTIONS: { id: AccommodationInterest; label: string }[] = [
  { id: 'PG', label: 'PG (Paying Guest)' },
  { id: 'Hostel', label: 'Hostel' },
  { id: 'Shared Flat', label: 'Shared Flat / Apartment' },
];
const BUDGET_TIERS: BudgetTier[] = [
  '₹6,000 – ₹9,000/mo',
  '₹9,000 – ₹15,000/mo',
  '₹15,000 – ₹22,000/mo',
  '₹22,000+/mo',
];

export function Step1Profile({ profile, onChange, onContinue }: Step1ProfileProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleLookingFor = (item: AccommodationInterest) => {
    const exists = profile.lookingFor.includes(item);
    const nextList = exists
      ? profile.lookingFor.filter((x) => x !== item)
      : [...profile.lookingFor, item];
    onChange({
      ...profile,
      lookingFor: nextList,
      bothOrAny: false,
    });
    if (errors.lookingFor) {
      setErrors((prev) => ({ ...prev, lookingFor: '' }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateStep1Profile(profile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onContinue();
  };

  const handleFillSample = () => {
    setErrors({});
    onChange({
      fullName: 'Aarav Nair',
      email: 'aarav.nair@student.edu',
      phone: '+91 98450 11223',
      gender: 'Male',
      lookingFor: ['PG', 'Hostel'],
      bothOrAny: true,
      expectedMoveIn: '2026-12-01',
      targetBudget: '₹9,000 – ₹15,000/mo',
    });
  };

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Step 1 of 2 · Student Profile</span>
        <span>Personalized Campus Match · Zero Brokerage</span>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm lg:grid-cols-12 lg:items-stretch">
        {/* Left Brand Showcase Panel (Deep LOCUS Indigo Gradient) */}
        <div className="relative flex flex-col justify-between bg-gradient-to-br from-[#14113E] via-[#241F66] to-[#36338B] p-6 text-white sm:p-8 lg:col-span-5 lg:p-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-indigo-200 uppercase">
              Campus Living Made Effortless
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.1rem] text-balance">
              Your university journey starts with a safe sanctuary.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-indigo-100/85">
              Skip the broker fee traps and shady listings. Connect directly to audited, high-speed
              furnished PGs and hostels within walking distance of Bengaluru campuses.
            </p>

            <div className="mt-7 space-y-3.5">
              <div className="rounded-xl border border-white/15 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-semibold text-white">100% Verified Properties</h2>
                    <p className="mt-1 text-xs leading-relaxed text-indigo-100/80">
                      Every residence is physically audited for biometric security, Wi-Fi throughput,
                      and FSSAI dining hygiene.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-indigo-200" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-semibold text-white">Zero Brokerage Guarantee</h2>
                    <p className="mt-1 text-xs leading-relaxed text-indigo-100/80">
                      No hidden agent fees or surprise commissions. Direct digital lease with
                      transparent refundable deposits.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <Radar className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-semibold text-white">Campus Gate Distance Radar</h2>
                    <p className="mt-1 text-xs leading-relaxed text-indigo-100/80">
                      Filter verified stays within 500m of Gate 1, Gate 2, or Metro corridors on an
                      interactive campus map.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-indigo-200/90">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Encrypted Student Identity
            </span>
            <span>Zero Marketing Spam</span>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="p-6 sm:p-8 lg:col-span-7 lg:p-10">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Tell us about yourself
              </h2>
              <button
                type="button"
                onClick={handleFillSample}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#36338B]/40 hover:text-[#36338B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Use sample student
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Help us tailor verified PG and hostel recommendations to your budget and move-in
              timeline.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <div>
              <label htmlFor="student-full-name" className="block text-sm font-semibold text-slate-800">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="student-full-name"
                type="text"
                value={profile.fullName}
                onChange={(e) => {
                  onChange({ ...profile, fullName: e.target.value });
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="e.g. Aarav Nair"
                className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#36338B] focus:outline-none focus:ring-2 focus:ring-[#36338B]/20 ${
                  errors.fullName ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.fullName && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="student-email" className="block text-sm font-semibold text-slate-800">
                  Student Email
                </label>
                <input
                  id="student-email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => onChange({ ...profile, email: e.target.value })}
                  placeholder="name@college.edu"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#36338B] focus:outline-none focus:ring-2 focus:ring-[#36338B]/20"
                />
              </div>
              <div>
                <label htmlFor="student-phone" className="block text-sm font-semibold text-slate-800">
                  Phone Number
                </label>
                <input
                  id="student-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => onChange({ ...profile, phone: e.target.value })}
                  placeholder="+91 98450 00000"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#36338B] focus:outline-none focus:ring-2 focus:ring-[#36338B]/20"
                />
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-slate-800">
                Gender <span className="text-rose-600">*</span>
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2.5">
                {GENDERS.map((g) => {
                  const selected = profile.gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => onChange({ ...profile, gender: g })}
                      aria-pressed={selected}
                      className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#36338B] bg-[#36338B] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                      <span>{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  I am looking for <span className="text-xs font-normal text-slate-500">(select all that apply)</span>
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={profile.bothOrAny}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChange({
                        ...profile,
                        bothOrAny: checked,
                        lookingFor: checked ? ['PG', 'Hostel'] : profile.lookingFor,
                      });
                      if (errors.lookingFor) setErrors((prev) => ({ ...prev, lookingFor: '' }));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-[#36338B] focus:ring-[#36338B]"
                  />
                  Both / Any nearby
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {ACCOMMODATION_OPTIONS.map((opt) => {
                  const active = profile.lookingFor.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleLookingFor(opt.id)}
                      aria-pressed={active}
                      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? 'border-[#36338B] bg-[#36338B] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {active && <Check className="h-4 w-4" aria-hidden="true" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.lookingFor && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.lookingFor}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="expected-move-in" className="block text-sm font-semibold text-slate-800">
                  Expected Move-In <span className="text-rose-600">*</span>
                </label>
                <input
                  id="expected-move-in"
                  type="date"
                  value={profile.expectedMoveIn}
                  onChange={(e) => {
                    onChange({ ...profile, expectedMoveIn: e.target.value });
                    if (errors.expectedMoveIn) {
                      setErrors((prev) => ({ ...prev, expectedMoveIn: '' }));
                    }
                  }}
                  className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 focus:border-[#36338B] focus:outline-none focus:ring-2 focus:ring-[#36338B]/20 ${
                    errors.expectedMoveIn ? 'border-rose-500' : 'border-slate-200'
                  }`}
                />
                {errors.expectedMoveIn && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                    {errors.expectedMoveIn}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="target-budget" className="block text-sm font-semibold text-slate-800">
                  Target Monthly Budget
                </label>
                <select
                  id="target-budget"
                  value={profile.targetBudget}
                  onChange={(e) =>
                    onChange({ ...profile, targetBudget: e.target.value as BudgetTier })
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-[#36338B] focus:outline-none focus:ring-2 focus:ring-[#36338B]/20"
                >
                  {BUDGET_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Your budget pre-configures map price filters in Step 3.
              </p>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#36338B] px-6 text-sm font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B] focus-visible:ring-offset-2"
              >
                <span>Continue to College Selection</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
