import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { AMENITY_LABELS, FOOD_POLICY_LABELS, VERIFICATION_TIER_LABELS } from '../data/locusData';
import type {
  AmenityKey,
  College,
  FilterPreferences,
  FoodPolicy,
  SharingType,
  SortOption,
  VerificationTier,
} from '../types/locus';
import { formatINR } from '../utils/housingLogic';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  college: College;
  preferences: FilterPreferences;
  onChange: (next: FilterPreferences) => void;
  onReset: () => void;
  resultCount: number;
}

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'nearest', label: 'Nearest first' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Ratings (Highest)' },
  { id: 'audit_score', label: 'Audit Score' },
];

const ACCOMMODATION_TYPES: { id: 'all' | VerificationTier; label: string }[] = [
  { id: 'all', label: 'All Stays' },
  { id: 'college_owned', label: VERIFICATION_TIER_LABELS.college_owned },
  { id: 'college_verified', label: VERIFICATION_TIER_LABELS.college_verified },
  { id: 'managed_apartment', label: VERIFICATION_TIER_LABELS.managed_apartment },
  { id: 'standard_pg', label: VERIFICATION_TIER_LABELS.standard_pg },
];

const SHARING_OPTIONS: (SharingType | 'all')[] = [
  'all',
  'Single',
  '2-Sharing',
  '3-Sharing',
  '4+ Sharing',
];

const DISTANCE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Any distance' },
  { value: 500, label: '< 500m (5 min)' },
  { value: 1000, label: '< 1 km (12 min)' },
  { value: 1500, label: '< 1.5 km' },
];

const AMENITY_KEYS: AmenityKey[] = [
  'wifi',
  'laundry',
  'security_24_7',
  'biometric',
  'gym',
  'power_backup',
  'ac',
  'study_lounge',
  'housekeeping',
];

const FOOD_KEYS: FoodPolicy[] = [
  'veg_only',
  'non_veg_available',
  'self_cooking',
  'fssai_certified',
];

export function FilterDrawer({
  isOpen,
  onClose,
  college,
  preferences,
  onChange,
  onReset,
  resultCount,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  const toggleAmenity = (key: AmenityKey) => {
    const exists = preferences.amenities.includes(key);
    onChange({
      ...preferences,
      amenities: exists
        ? preferences.amenities.filter((a) => a !== key)
        : [...preferences.amenities, key],
    });
  };

  const toggleFood = (key: FoodPolicy) => {
    const exists = preferences.foodPolicies.includes(key);
    onChange({
      ...preferences,
      foodPolicies: exists
        ? preferences.foodPolicies.filter((f) => f !== key)
        : [...preferences.foodPolicies, key],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-drawer-title"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-[#36338B]" aria-hidden="true" />
            <div>
              <h2 id="filter-drawer-title" className="text-base font-bold text-slate-900">
                Preference Filters
              </h2>
              <p className="text-xs text-slate-500">
                Customizing stays near {college.shortName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset All
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preference filters"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Sections */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Sort By */}
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">Sort By</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => {
                const active = preferences.sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ ...preferences, sortBy: opt.id })}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#36338B] bg-[#36338B] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Monthly Rent */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <label htmlFor="filter-max-rent" className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                Max Monthly Rent
              </label>
              <span className="font-mono text-sm font-bold text-[#36338B] tabular-nums">
                {preferences.maxRent >= 25000 ? '₹25,000+ /mo' : `${formatINR(preferences.maxRent)}/mo`}
              </span>
            </div>
            <input
              id="filter-max-rent"
              type="range"
              min={5000}
              max={25000}
              step={500}
              value={preferences.maxRent}
              onChange={(e) =>
                onChange({ ...preferences, maxRent: Number(e.target.value) })
              }
              className="mt-3 w-full accent-[#36338B] cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400 tabular-nums">
              <span>₹5,000</span>
              <span>₹12,000</span>
              <span>₹18,000</span>
              <span>₹25,000+</span>
            </div>
          </div>

          {/* Accommodation Type */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
              Accommodation Type
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {ACCOMMODATION_TYPES.map((type) => {
                const active = preferences.accommodationType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onChange({ ...preferences, accommodationType: type.id })}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#36338B] bg-[#36338B] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location: Distance & Campus Gate */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
              Location &amp; Distance to {college.code} Gates
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {DISTANCE_OPTIONS.map((opt) => {
                const active = preferences.maxDistanceMeters === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => onChange({ ...preferences, maxDistanceMeters: opt.value })}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#36338B] bg-[#36338B] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...preferences, gateId: 'all' })}
                className={`h-8 rounded-lg border px-2.5 text-xs font-medium cursor-pointer ${
                  preferences.gateId === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Gates
              </button>
              {college.gates.map((gate) => {
                const active = preferences.gateId === gate.id;
                return (
                  <button
                    key={gate.id}
                    type="button"
                    onClick={() => onChange({ ...preferences, gateId: gate.id })}
                    className={`h-8 rounded-lg border px-2.5 text-xs font-medium cursor-pointer ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {gate.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Occupancy & Gender */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
              Occupancy / Sharing
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {SHARING_OPTIONS.map((sharing) => {
                const active = preferences.sharing === sharing;
                return (
                  <button
                    key={sharing}
                    type="button"
                    onClick={() => onChange({ ...preferences, sharing })}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold cursor-pointer ${
                      active
                        ? 'border-[#36338B] bg-[#36338B] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sharing === 'all' ? 'Any Sharing' : sharing}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food & Mess Guidelines */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
              Food &amp; Mess Guidelines
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {FOOD_KEYS.map((key) => {
                const active = preferences.foodPolicies.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFood(key)}
                    aria-pressed={active}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold cursor-pointer ${
                      active
                        ? 'border-emerald-700 bg-emerald-700 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {FOOD_POLICY_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific Amenities */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase">
              Required Amenities
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {AMENITY_KEYS.map((key) => {
                const active = preferences.amenities.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmenity(key)}
                    aria-pressed={active}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold cursor-pointer ${
                      active
                        ? 'border-[#36338B] bg-[#36338B] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {AMENITY_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-[#36338B] px-5 text-sm font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer tabular-nums"
          >
            Show {resultCount} {resultCount === 1 ? 'Property' : 'Properties'}
          </button>
        </div>
      </div>
    </div>
  );
}
