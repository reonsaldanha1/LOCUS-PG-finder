import {
  ArrowLeft,
  Bookmark,
  List,
  Map as MapIcon,
  RotateCcw,
  Scale,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AMENITY_LABELS } from '../data/locusData';
import type {
  AmenityKey,
  College,
  FilterPreferences,
  PGProperty,
} from '../types/locus';
import { filterAndSortProperties, formatINR } from '../utils/housingLogic';
import { FilterDrawer } from './FilterDrawer';
import { InteractiveCampusMap } from './InteractiveCampusMap';
import { PropertyCard } from './PropertyCard';

interface Step3DiscoveryProps {
  college: College;
  properties: PGProperty[];
  loading: boolean;
  preferences: FilterPreferences;
  onChangePreferences: (next: FilterPreferences) => void;
  onResetPreferences: () => void;
  onChangeCollege: () => void;
  savedIds: string[];
  onToggleSave: (propertyId: string) => void;
  compareIds: string[];
  onToggleCompare: (propertyId: string) => void;
  onOpenCompareModal: () => void;
  onOpenBookingModal: (property: PGProperty) => void;
}

const QUICK_AMENITIES: AmenityKey[] = ['wifi', 'biometric', 'laundry', 'ac'];

export function Step3Discovery({
  college,
  properties,
  loading,
  preferences,
  onChangePreferences,
  onResetPreferences,
  onChangeCollege,
  savedIds,
  onToggleSave,
  compareIds,
  onToggleCompare,
  onOpenCompareModal,
  onOpenBookingModal,
}: Step3DiscoveryProps) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [savedOnly, setSavedOnly] = useState(false);

  const filteredProperties = useMemo(() => {
    const base = filterAndSortProperties(properties, college.id, preferences);
    if (savedOnly) {
      return base.filter((p) => savedIds.includes(p.id));
    }
    return base;
  }, [properties, college.id, preferences, savedOnly, savedIds]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (preferences.accommodationType !== 'all') count += 1;
    if (preferences.maxDistanceMeters !== null) count += 1;
    if (preferences.gateId !== 'all') count += 1;
    if (preferences.sharing !== 'all') count += 1;
    if (preferences.maxRent < 25000) count += 1;
    count += preferences.foodPolicies.length;
    count += preferences.amenities.length;
    return count;
  }, [preferences]);

  const toggleQuickAmenity = (key: AmenityKey) => {
    const exists = preferences.amenities.includes(key);
    onChangePreferences({
      ...preferences,
      amenities: exists
        ? preferences.amenities.filter((a) => a !== key)
        : [...preferences.amenities, key],
    });
  };

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
      {/* Top Campus Context & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={onChangeCollege}
                className="inline-flex items-center gap-1 font-semibold text-[#36338B] hover:underline cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Change College
              </button>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span>{college.area}</span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span className="font-semibold text-slate-700 tabular-nums">
                {filteredProperties.length} Verified Stays
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Stays near {college.shortName}
            </h1>
          </div>

          {/* Search + Mobile List/Map Toggle + Filter Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] sm:w-64 sm:flex-none">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={preferences.searchQuery}
                onChange={(e) =>
                  onChangePreferences({ ...preferences, searchQuery: e.target.value })
                }
                placeholder="Search PG, street, or gate..."
                aria-label="Search PG or neighborhood"
                className="h-10 w-full rounded-xl border border-slate-200 bg-[#F8F9FC] pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#36338B] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setSavedOnly((prev) => !prev)}
              aria-pressed={savedOnly}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                savedOnly
                  ? 'border-[#36338B] bg-[#36338B] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Saved ({savedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:border-[#36338B] hover:text-[#36338B] transition-colors cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Preferences</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-[#36338B] px-1.5 text-[11px] font-bold text-white tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Preference Bar (Price, Distance, Amenities) */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto border-t border-slate-100 pt-3 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {/* Quick Price Select */}
          <label className="sr-only" htmlFor="quick-budget-select">
            Max Monthly Rent
          </label>
          <select
            id="quick-budget-select"
            value={preferences.maxRent}
            onChange={(e) =>
              onChangePreferences({ ...preferences, maxRent: Number(e.target.value) })
            }
            className="h-9 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 focus:border-[#36338B] focus:outline-none cursor-pointer"
          >
            <option value={9500}>Up to ₹9,500/mo</option>
            <option value={12000}>Up to ₹12,000/mo</option>
            <option value={15000}>Up to ₹15,000/mo</option>
            <option value={22000}>Up to ₹22,000/mo</option>
            <option value={30000}>Any Price</option>
          </select>

          {/* Quick Distance Select */}
          <label className="sr-only" htmlFor="quick-distance-select">
            Max Distance
          </label>
          <select
            id="quick-distance-select"
            value={preferences.maxDistanceMeters ?? 'any'}
            onChange={(e) =>
              onChangePreferences({
                ...preferences,
                maxDistanceMeters: e.target.value === 'any' ? null : Number(e.target.value),
              })
            }
            className="h-9 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 focus:border-[#36338B] focus:outline-none cursor-pointer"
          >
            <option value="any">Any Distance</option>
            <option value="500">≤ 500m (5 min walk)</option>
            <option value="1000">≤ 1 km walk</option>
          </select>

          {/* Quick Amenity Buttons */}
          {QUICK_AMENITIES.map((key) => {
            const active = preferences.amenities.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleQuickAmenity(key)}
                aria-pressed={active}
                className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#36338B] bg-[#36338B] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {AMENITY_LABELS[key]}
              </button>
            );
          })}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSavedOnly(false);
                onResetPreferences();
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>

        {/* Mobile List / Map Switcher */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              mobileView === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" />
            List ({filteredProperties.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              mobileView === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Interactive Map
          </button>
        </div>
      </div>

      {/* Main Split Workspace: List Left + Interactive Map Right */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Listings Column */}
        <div
          className={`space-y-4 lg:col-span-7 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-base font-bold text-slate-900">
                No verified stays match your current filters
              </p>
              <p className="mt-1.5 text-sm text-slate-500">
                Try raising your max rent beyond {formatINR(preferences.maxRent)} or clearing a
                distance or amenity filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSavedOnly(false);
                  onResetPreferences();
                }}
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#36338B] px-5 text-xs font-semibold text-white hover:bg-[#29266E] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredProperties.map((pg) => (
              <PropertyCard
                key={pg.id}
                property={pg}
                isSelectedOnMap={selectedPropertyId === pg.id}
                isSaved={savedIds.includes(pg.id)}
                isCompared={compareIds.includes(pg.id)}
                compareDisabled={compareIds.length >= 3}
                activeSharingFilter={preferences.sharing}
                onSelectOnMap={() => {
                  setSelectedPropertyId(pg.id);
                  setMobileView('map');
                }}
                onToggleSave={() => onToggleSave(pg.id)}
                onToggleCompare={() => onToggleCompare(pg.id)}
                onOpenBooking={() => onOpenBookingModal(pg)}
              />
            ))
          )}
        </div>

        {/* Sticky Interactive Campus Map Column */}
        <div
          className={`lg:col-span-5 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="lg:sticky lg:top-20">
            <InteractiveCampusMap
              college={college}
              properties={filteredProperties}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={(id) => setSelectedPropertyId(id)}
              onOpenBooking={onOpenBookingModal}
              activeSharingFilter={preferences.sharing}
              selectedGateId={preferences.gateId}
              onSelectGate={(gateId) =>
                onChangePreferences({ ...preferences, gateId })
              }
            />
          </div>
        </div>
      </div>

      {/* Floating Comparison Bar (when >= 1 PG selected) */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-800 bg-[#181548] px-4 py-3 text-white shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <Scale className="h-4 w-4 text-indigo-300 shrink-0" aria-hidden="true" />
              <span className="font-semibold tabular-nums">
                {compareIds.length} of 3 PGs selected for comparison
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenCompareModal}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-4 text-xs font-bold text-[#181548] hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Compare Now
            </button>
          </div>
        </div>
      )}

      {/* Full Preference Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        college={college}
        preferences={preferences}
        onChange={onChangePreferences}
        onReset={onResetPreferences}
        resultCount={filteredProperties.length}
      />
    </section>
  );
}
