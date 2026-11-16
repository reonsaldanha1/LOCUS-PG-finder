import {
  Compass,
  GraduationCap,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  ShieldCheck,
  TrainFront,
} from 'lucide-react';
import { useRef, useState, type PointerEvent } from 'react';
import { VERIFICATION_TIER_LABELS } from '../data/locusData';
import type { College, PGProperty, SharingType } from '../types/locus';
import { formatINR, getRentForSharing } from '../utils/housingLogic';

interface InteractiveCampusMapProps {
  college: College;
  properties: PGProperty[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string) => void;
  onOpenBooking: (property: PGProperty) => void;
  activeSharingFilter: SharingType | 'all';
  selectedGateId: string;
  onSelectGate: (gateId: string) => void;
}

export function InteractiveCampusMap({
  college,
  properties,
  selectedPropertyId,
  onSelectProperty,
  onOpenBooking,
  activeSharingFilter,
  selectedGateId,
  onSelectGate,
}: InteractiveCampusMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) ?? null;

  const handleZoomIn = () => setZoom((z) => Math.min(1.65, Number((z + 0.2).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, Number((z - 0.2).toFixed(2))));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: Math.max(-180, Math.min(180, dragStartRef.current.panX + dx)),
      y: Math.max(-160, Math.min(160, dragStartRef.current.panY + dy)),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const getPinStyles = (pg: PGProperty, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-[#181548] text-white border-white ring-2 ring-[#36338B] scale-110 z-30 shadow-lg';
    }
    switch (pg.verificationTier) {
      case 'college_owned':
        return 'bg-[#36338B] text-white border-white hover:bg-[#29266E] z-20 shadow-md';
      case 'college_verified':
        return 'bg-emerald-700 text-white border-white hover:bg-emerald-800 z-20 shadow-md';
      default:
        return 'bg-white text-slate-900 border-slate-300 hover:border-[#36338B] z-10 shadow-sm';
    }
  };

  return (
    <div
      data-testid="interactive-campus-map"
      className="relative flex h-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#EEF2F6] select-none lg:h-[calc(100vh-225px)] lg:min-h-[540px]"
    >
      {/* Top Map Header Overlay */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
          <Navigation className="h-3.5 w-3.5 text-[#36338B]" aria-hidden="true" />
          <div className="text-xs">
            <span className="font-bold text-slate-900">{college.shortName} Corridor</span>
            <span className="mx-1.5 text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-slate-600 tabular-nums">
              {properties.length} stays mapped
            </span>
          </div>
        </div>

        {/* Zoom & Recenter Controls */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in map"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out map"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Recenter map"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Pannable / Zoomable Spatial Canvas */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative flex-1 overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="relative h-full w-full"
        >
          {/* Architectural Neighborhood Grid + Streets + Walking Rings */}
          <svg
            viewBox="-100 -100 200 200"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            className="h-full w-full"
          >
            {/* Base Urban Blocks */}
            <rect x="-120" y="-120" width="240" height="240" fill="#EDF1F7" />
            <rect x="-85" y="-85" width="42" height="36" rx="3" fill="#E3E9F2" />
            <rect x="28" y="-82" width="54" height="40" rx="3" fill="#E3E9F2" />
            <rect x="-82" y="34" width="48" height="42" rx="3" fill="#E3E9F2" />
            <rect x="34" y="32" width="46" height="44" rx="3" fill="#E3E9F2" />

            {/* Campus Green Park Footprint */}
            <rect
              x="-24"
              y="-20"
              width="48"
              height="40"
              rx="6"
              fill="#DCECE4"
              stroke="#B7DAC8"
              strokeWidth="0.6"
            />

            {/* Primary & Secondary Roads */}
            <path d="M -115 -26 L 115 -26" stroke="#FFFFFF" strokeWidth="3.2" />
            <path d="M -115 26 L 115 26" stroke="#FFFFFF" strokeWidth="2.8" />
            <path d="M -28 -115 L -28 115" stroke="#FFFFFF" strokeWidth="3" />
            <path d="M 28 -115 L 28 115" stroke="#FFFFFF" strokeWidth="3.4" />
            <path d="M -115 62 L 115 -62" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 1" />

            {/* Subtle Road Centerlines */}
            <path d="M -115 -26 L 115 -26" stroke="#CBD5E1" strokeWidth="0.35" />
            <path d="M 28 -115 L 28 115" stroke="#CBD5E1" strokeWidth="0.35" />

            {/* Concentric Walking Radius Rings */}
            <circle
              cx="0"
              cy="0"
              r="34"
              fill="rgba(54, 51, 139, 0.04)"
              stroke="#36338B"
              strokeOpacity="0.32"
              strokeWidth="0.65"
              strokeDasharray="2 2"
            />
            <circle
              cx="0"
              cy="0"
              r="62"
              fill="none"
              stroke="#64748B"
              strokeOpacity="0.28"
              strokeWidth="0.55"
              strokeDasharray="2.5 2.5"
            />
            <circle
              cx="0"
              cy="0"
              r="88"
              fill="none"
              stroke="#94A3B8"
              strokeOpacity="0.22"
              strokeWidth="0.45"
            />
          </svg>

          {/* Street & Perimeter Labels */}
          <div className="pointer-events-none absolute left-1/2 top-[33%] -translate-x-1/2 text-[10px] font-semibold tracking-wide text-[#36338B]/75">
            500m · 5 min walk
          </div>
          <div className="pointer-events-none absolute left-1/2 top-[19%] -translate-x-1/2 text-[10px] font-medium text-slate-500">
            1.0 km perimeter
          </div>
          {college.streets[0] && (
            <div className="pointer-events-none absolute left-[6%] top-[28%] z-0 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {college.streets[0]}
            </div>
          )}
          {college.streets[1] && (
            <div className="pointer-events-none absolute left-[6%] bottom-[16%] z-0 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {college.streets[1]}
            </div>
          )}

          {/* Transit Indicator */}
          <div
            style={{ left: '78%', top: '82%' }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-0 flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-xs"
          >
            <TrainFront className="h-3 w-3 text-[#36338B]" aria-hidden="true" />
            <span className="whitespace-nowrap">{college.transitLabel.split('(')[0].trim()}</span>
          </div>

          {/* College Campus Centerpiece Marker */}
          <div
            style={{ left: '50%', top: '50%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
          >
            <div className="flex items-center gap-1.5 rounded-xl border border-[#36338B]/30 bg-[#181548] px-3 py-1.5 text-white shadow-md">
              <GraduationCap className="h-4 w-4 text-indigo-200" aria-hidden="true" />
              <span className="text-xs font-bold whitespace-nowrap">
                {college.code} Campus
              </span>
            </div>
          </div>

          {/* Interactive Gate Markers */}
          {college.gates.map((gate) => {
            const leftPct = 50 + gate.x * 0.95;
            const topPct = 50 + gate.y * 0.95;
            const isGateActive = selectedGateId === gate.id;
            return (
              <button
                key={gate.id}
                type="button"
                onClick={() => onSelectGate(isGateActive ? 'all' : gate.id)}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                title={`Filter near ${gate.label}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isGateActive
                    ? 'border-[#36338B] bg-[#36338B] text-white'
                    : 'border-slate-300 bg-white/95 text-slate-700 hover:border-[#36338B]'
                }`}
              >
                <Compass className="h-2.5 w-2.5" aria-hidden="true" />
                <span>{gate.label.split(' ')[0]} {gate.label.split(' ')[1]}</span>
              </button>
            );
          })}

          {/* Interactive PG Price Pins */}
          {properties.map((pg) => {
            const leftPct = Math.max(10, Math.min(90, 50 + pg.mapCoords.x * 0.55));
            const topPct = Math.max(14, Math.min(86, 50 + pg.mapCoords.y * 0.55));
            const isSelected = pg.id === selectedPropertyId;
            const displayedRent = getRentForSharing(pg, activeSharingFilter);

            return (
              <button
                key={pg.id}
                type="button"
                onClick={() => onSelectProperty(pg.id)}
                aria-label={`${pg.name}, ${formatINR(displayedRent)} per month, ${pg.distanceMeters} meters from campus`}
                aria-pressed={isSelected}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums transition-all cursor-pointer whitespace-nowrap ${getPinStyles(
                  pg,
                  isSelected,
                )}`}
              >
                {formatINR(displayedRent)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Legend or Selected Pin Preview Card */}
      <div className="border-t border-slate-200 bg-white p-3">
        {selectedProperty ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selectedProperty.imageUrl}
                alt={selectedProperty.name}
                referrerPolicy="no-referrer"
                className="h-14 w-16 shrink-0 rounded-lg object-cover bg-slate-100"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      selectedProperty.verificationTier === 'college_owned'
                        ? 'font-bold text-[#36338B]'
                        : selectedProperty.verificationTier === 'college_verified'
                          ? 'font-bold text-emerald-800'
                          : 'font-semibold text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{VERIFICATION_TIER_LABELS[selectedProperty.verificationTier]}</span>
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-slate-600 font-medium tabular-nums">
                    {selectedProperty.distanceMeters}m ({selectedProperty.walkMinutes} min walk)
                  </span>
                </div>
                <p className="truncate text-sm font-bold text-slate-900">{selectedProperty.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {selectedProperty.neighborhood} · Starts at{' '}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatINR(getRentForSharing(selectedProperty, activeSharingFilter))}/mo
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenBooking(selectedProperty)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#36338B] px-4 text-xs font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer whitespace-nowrap"
              >
                Inspect &amp; Book
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#36338B]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#36338B]" aria-hidden="true" />
                College Owned
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700" aria-hidden="true" />
                College Verified PG
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-sm border border-slate-400 bg-white" aria-hidden="true" />
                Standard / Managed
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Click any price pin to inspect
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
