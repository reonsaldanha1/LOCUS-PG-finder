import { ArrowLeft, ArrowRight, Check, MapPin, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { COLLEGES } from '../data/locusData';
import type { College } from '../types/locus';

interface Step2CollegeProps {
  selectedCollegeId: string;
  onSelectCollege: (collegeId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function Step2College({
  selectedCollegeId,
  onSelectCollege,
  onBack,
  onContinue,
}: Step2CollegeProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredColleges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COLLEGES;
    return COLLEGES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const popularHubs = filteredColleges.filter((c) => c.popular);
  const otherColleges = filteredColleges.filter((c) => !c.popular);
  const selectedCollege: College =
    COLLEGES.find((c) => c.id === selectedCollegeId) ?? COLLEGES[0];

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-[#36338B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Profile Setup
        </button>
        <span>Step 2 of 2 · Campus Selection &amp; Residence Matching</span>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
            Select Your College
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Choose your institution to inspect verified PGs, official hostels, and walking corridors
            around campus gates.
          </p>
        </div>

        {/* Search & City Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search college name, code (e.g. MSRIT, IISc, RVCE) or area..."
              aria-label="Search college"
              className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#36338B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36338B]/20"
            />
          </div>
          <div className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 shrink-0">
            <MapPin className="h-4 w-4 text-[#36338B]" aria-hidden="true" />
            <span>Bengaluru</span>
          </div>
        </div>

        {filteredColleges.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No colleges matched &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try searching for MSRIT, IISc, RVCE, BMSCE, PESU, or Christ University.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#36338B] px-4 text-xs font-semibold text-white cursor-pointer"
            >
              Show All Campuses
            </button>
          </div>
        ) : (
          <>
            {/* Popular in Bengaluru */}
            {popularHubs.length > 0 && (
              <div className="mt-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Popular in Bengaluru</h2>
                    <p className="text-xs text-slate-500">
                      Institutions with direct LOCUS verified accommodations within walking distance
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {popularHubs.length} Hubs
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {popularHubs.map((college) => {
                    const isSelected = college.id === selectedCollegeId;
                    return (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => onSelectCollege(college.id)}
                        aria-pressed={isSelected}
                        className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B] ${
                          isSelected
                            ? 'border-[#36338B] bg-[#36338B]/[0.04] ring-1 ring-[#36338B]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`inline-flex h-10 w-12 items-center justify-center rounded-lg text-xs font-bold tracking-tight ${
                                isSelected
                                  ? 'bg-[#36338B] text-white'
                                  : 'bg-slate-100 text-[#181548]'
                              }`}
                            >
                              {college.code}
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#36338B]">
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                Selected
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 text-base font-bold text-slate-900">
                            {college.shortName}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                            {college.name}
                          </p>
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{college.area}</span>
                          </p>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
                          <div
                            className={`flex items-center gap-1.5 ${
                              college.isOfficialPartner
                                ? 'font-bold text-emerald-800'
                                : 'font-semibold text-slate-700'
                            }`}
                          >
                            {college.isOfficialPartner && (
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            )}
                            <span className={college.isOfficialPartner ? 'font-bold' : ''}>
                              {college.highlightLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-500">{college.bedsAvailableLabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Colleges in Greater Bengaluru */}
            {otherColleges.length > 0 && (
              <div className="mt-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    All Colleges in Greater Bengaluru
                  </h2>
                  <span className="text-xs text-slate-500">
                    Showing {otherColleges.length} additional campuses
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {otherColleges.map((college) => {
                    const isSelected = college.id === selectedCollegeId;
                    return (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => onSelectCollege(college.id)}
                        aria-pressed={isSelected}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B] ${
                          isSelected
                            ? 'border-[#36338B] bg-[#36338B]/[0.05] ring-1 ring-[#36338B]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`flex h-9 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              isSelected
                                ? 'bg-[#36338B] text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {college.code}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {college.shortName}
                            </p>
                            <p className="truncate text-xs text-slate-500">{college.area}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500 tabular-nums shrink-0">
                          {college.distanceNote.split(' ')[0]} {college.distanceNote.split(' ')[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected Campus Footer Action Bar */}
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-[#F8F9FC] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Your Selected Campus</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {selectedCollege.name} ({selectedCollege.code}) · {selectedCollege.area}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{selectedCollege.transitLabel}</p>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#36338B] px-6 text-sm font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B] focus-visible:ring-offset-2"
          >
            <span>Continue to Campus Housing</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
