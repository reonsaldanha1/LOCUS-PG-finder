import { Building2, Compass, Menu, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';

export type StudentNavTab = 'step1' | 'step2' | 'discover' | 'bookings';

interface NavbarProps {
  activeTab: StudentNavTab;
  onNavigate: (tab: StudentNavTab) => void;
  onOpenPartnerPortal: () => void;
  selectedCollegeCode?: string;
  bookingsCount: number;
  compareCount: number;
  onOpenCompare: () => void;
}

export function Navbar({
  activeTab,
  onNavigate,
  onOpenPartnerPortal,
  selectedCollegeCode,
  bookingsCount,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: StudentNavTab; label: string }[] = [
    { id: 'step1', label: 'Profile' },
    { id: 'step2', label: 'Select College' },
    {
      id: 'discover',
      label: selectedCollegeCode ? `PGs · ${selectedCollegeCode}` : 'Find PGs',
    },
    {
      id: 'bookings',
      label: bookingsCount > 0 ? `Bookings (${bookingsCount})` : 'My Bookings',
    },
  ];

  const handleSelect = (tab: StudentNavTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('step1')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B] rounded-md px-1 py-1"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#36338B] text-white">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-[#181548]">LOCUS</span>
        </button>

        {/* Zone 2: Concise single-line nav links (Desktop) */}
        <nav
          aria-label="Primary student navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B] rounded-sm ${
                  isActive
                    ? 'text-[#36338B] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-[#36338B]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action (Partner Portal) + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenPartnerPortal}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-[#181548] hover:border-[#36338B]/40 hover:bg-[#36338B]/5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B]"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#36338B]" aria-hidden="true" />
            Partner Portal
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36338B]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav aria-label="Mobile student navigation" className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex h-11 items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#36338B]/10 text-[#36338B] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <Compass className="h-4 w-4 opacity-50" aria-hidden="true" />
                </button>
              );
            })}
            <div className="my-2 border-t border-slate-100" />
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPartnerPortal();
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#181548] px-4 text-sm font-semibold text-white"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Open Partner Portal
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
