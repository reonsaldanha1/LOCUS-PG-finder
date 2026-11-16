import { Check, Minus, ShieldCheck, Trash2, X } from 'lucide-react';
import {
  AMENITY_LABELS,
  FOOD_POLICY_LABELS,
  VERIFICATION_TIER_LABELS,
} from '../data/locusData';
import type { AmenityKey, PGProperty } from '../types/locus';
import { formatINR } from '../utils/housingLogic';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PGProperty[];
  onRemoveProperty: (propertyId: string) => void;
  onBookProperty: (property: PGProperty) => void;
}

const COMPARE_AMENITIES: AmenityKey[] = [
  'wifi',
  'laundry',
  'security_24_7',
  'biometric',
  'ac',
  'gym',
  'study_lounge',
  'power_backup',
];

export function ComparisonModal({
  isOpen,
  onClose,
  properties,
  onRemoveProperty,
  onBookProperty,
}: ComparisonModalProps) {
  if (!isOpen) return null;

  const lowestRent =
    properties.length > 0 ? Math.min(...properties.map((p) => p.startingRent)) : 0;
  const closestDistance =
    properties.length > 0 ? Math.min(...properties.map((p) => p.distanceMeters)) : 0;
  const highestAudit =
    properties.length > 0 ? Math.max(...properties.map((p) => p.auditScore)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="compare-modal-title" className="text-lg font-bold text-slate-900">
              Side-by-Side Residence Comparison
            </h2>
            <p className="text-xs text-slate-500">
              Compare monthly pricing, walking distance, safety audit scores, and amenities
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 sm:p-6">
          {properties.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-sm font-semibold text-slate-800">No properties selected yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Select up to 3 PGs using the Compare button on any listing card.
              </p>
            </div>
          ) : (
            <div className="min-w-[640px]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="w-44 py-3 pr-4 align-bottom text-xs font-bold tracking-wide text-slate-500 uppercase">
                      Feature
                    </th>
                    {properties.map((pg) => (
                      <th key={pg.id} className="min-w-[180px] px-3 pb-4 align-top">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#F8F9FC] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-xs ${
                                pg.verificationTier === 'college_owned'
                                  ? 'font-bold text-[#36338B]'
                                  : pg.verificationTier === 'college_verified'
                                    ? 'font-bold text-emerald-800'
                                    : 'font-semibold text-slate-600'
                              }`}
                            >
                              {VERIFICATION_TIER_LABELS[pg.verificationTier]}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveProperty(pg.id)}
                              aria-label={`Remove ${pg.name} from comparison`}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-sm font-bold text-slate-900">{pg.name}</p>
                          <p className="text-xs font-normal text-slate-500">{pg.neighborhood}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">
                      Starting Monthly Rent
                    </td>
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 py-3 font-mono font-bold tabular-nums">
                        <span
                          className={
                            pg.startingRent === lowestRent
                              ? 'text-emerald-700'
                              : 'text-slate-900'
                          }
                        >
                          {formatINR(pg.startingRent)}/mo
                        </span>
                        {pg.startingRent === lowestRent && properties.length > 1 && (
                          <span className="ml-2 font-sans text-[11px] font-semibold text-emerald-700">
                            Best Value
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">
                      Refundable Deposit
                    </td>
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 py-3 font-mono text-slate-700 tabular-nums">
                        {formatINR(pg.deposit)} · ₹0 Brokerage
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">
                      Distance to Campus
                    </td>
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 py-3 text-xs tabular-nums">
                        <span
                          className={`font-semibold ${
                            pg.distanceMeters === closestDistance
                              ? 'text-[#36338B]'
                              : 'text-slate-800'
                          }`}
                        >
                          {pg.distanceMeters}m ({pg.walkMinutes} min walk)
                        </span>
                        <p className="text-slate-500">{pg.gateLabel}</p>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">
                      Campus Audit Score
                    </td>
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 py-3 text-xs font-semibold tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            pg.auditScore === highestAudit
                              ? 'text-emerald-700'
                              : 'text-slate-800'
                          }`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {pg.auditScore}/100
                        </span>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">
                      Sharing Options
                    </td>
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 py-3 text-xs text-slate-700">
                        {pg.roomOptions.map((r) => r.sharing).join(' · ')}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">
                      Food &amp; Mess Policy
                    </td>
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 py-3 text-xs text-slate-700">
                        {pg.foodPolicy.map((f) => FOOD_POLICY_LABELS[f]).join(', ')}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 pr-4 text-xs font-semibold text-slate-600">Curfew Policy</td>
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 py-3 text-xs text-slate-700">
                        {pg.curfewPolicy}
                      </td>
                    ))}
                  </tr>

                  {COMPARE_AMENITIES.map((amenity) => (
                    <tr key={amenity}>
                      <td className="py-2.5 pr-4 text-xs font-medium text-slate-600">
                        {AMENITY_LABELS[amenity]}
                      </td>
                      {properties.map((pg) => {
                        const included = pg.amenities.includes(amenity);
                        return (
                          <td key={pg.id} className="px-3 py-2.5 text-xs">
                            {included ? (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                Included
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                                Not listed
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr>
                    <td className="pt-4 pr-4" />
                    {properties.map((pg) => (
                      <td key={pg.id} className="px-3 pt-4">
                        <button
                          type="button"
                          onClick={() => onBookProperty(pg)}
                          className="h-10 w-full rounded-xl bg-[#36338B] px-4 text-xs font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer"
                        >
                          Book {pg.name.split(' ')[0]}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
