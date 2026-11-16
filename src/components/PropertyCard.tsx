import {
  Bookmark,
  Building2,
  Check,
  MapPin,
  Scale,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { AMENITY_LABELS, VERIFICATION_TIER_LABELS } from '../data/locusData';
import type { PGProperty, SharingType } from '../types/locus';
import { formatINR, getRentForSharing } from '../utils/housingLogic';

interface PropertyCardProps {
  property: PGProperty;
  isSelectedOnMap: boolean;
  isSaved: boolean;
  isCompared: boolean;
  compareDisabled: boolean;
  activeSharingFilter: SharingType | 'all';
  onSelectOnMap: () => void;
  onToggleSave: () => void;
  onToggleCompare: () => void;
  onOpenBooking: () => void;
}

export function PropertyCard({
  property,
  isSelectedOnMap,
  isSaved,
  isCompared,
  compareDisabled,
  activeSharingFilter,
  onSelectOnMap,
  onToggleSave,
  onToggleCompare,
  onOpenBooking,
}: PropertyCardProps) {
  const [imgError, setImgError] = useState(false);
  const displayedRent = getRentForSharing(property, activeSharingFilter);

  return (
    <article
      data-testid={`pg-card-${property.id}`}
      className={`overflow-hidden rounded-2xl border bg-white transition-all ${
        isSelectedOnMap
          ? 'border-[#36338B] ring-2 ring-[#36338B]/20 shadow-sm'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12">
        {/* Property Image */}
        <div className="relative aspect-[4/3] sm:col-span-5 sm:aspect-auto sm:min-h-[210px] bg-slate-100">
          {!imgError ? (
            <img
              src={property.imageUrl}
              alt={`${property.name} interior`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 text-center text-slate-500">
              <Building2 className="h-8 w-8 text-slate-400" aria-hidden="true" />
              <span className="mt-2 text-xs font-medium">{property.name}</span>
            </div>
          )}

          {/* Save Bookmark Button */}
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={isSaved ? `Remove ${property.name} from saved` : `Save ${property.name}`}
            aria-pressed={isSaved}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors cursor-pointer ${
              isSaved
                ? 'border-[#36338B] bg-[#36338B] text-white'
                : 'border-white/70 bg-white/90 text-slate-700 hover:bg-white'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Property Details */}
        <div className="flex flex-col justify-between p-4 sm:col-span-7 sm:p-5">
          <div>
            {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
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
                {VERIFICATION_TIER_LABELS[property.verificationTier]}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 tabular-nums">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {property.rating.toFixed(1)}
                <span className="font-normal text-slate-400">({property.reviewCount})</span>
              </span>
            </div>

            <div className="mt-1.5 flex items-start justify-between gap-3">
              <h3 className="text-base font-bold leading-snug text-slate-900">
                <button
                  type="button"
                  onClick={onSelectOnMap}
                  className="text-left hover:text-[#36338B] transition-colors cursor-pointer"
                >
                  {property.name}
                </button>
              </h3>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" aria-hidden="true" />
                {property.distanceMeters}m from {property.gateLabel}
              </span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span>{property.genderPolicy}</span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span
                className={
                  property.bedsAvailable <= 2 ? 'font-semibold text-amber-700' : 'text-slate-600'
                }
              >
                {property.bedsAvailable} {property.bedsAvailable === 1 ? 'bed' : 'beds'} left
              </span>
            </div>

            {/* Clean Typographic Amenities Line */}
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {property.amenities
                .slice(0, 4)
                .map((a) => AMENITY_LABELS[a])
                .join(' · ')}
            </p>
          </div>

          {/* Pricing & Actions Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                {activeSharingFilter === 'all' ? 'Starts at' : activeSharingFilter}
              </p>
              <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                {formatINR(displayedRent)}
                <span className="font-sans text-xs font-normal text-slate-500">/mo</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleCompare}
                disabled={compareDisabled && !isCompared}
                aria-pressed={isCompared}
                aria-label={isCompared ? `Remove ${property.name} from compare` : `Compare ${property.name}`}
                className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                  isCompared
                    ? 'border-[#36338B] bg-[#36338B]/10 text-[#36338B]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isCompared ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isCompared ? 'Compared' : 'Compare'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenBooking}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#36338B] px-4 text-xs font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer whitespace-nowrap"
              >
                View &amp; Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
