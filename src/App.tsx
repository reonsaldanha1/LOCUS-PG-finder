import { useEffect, useState } from 'react';
import { ComparisonModal } from './components/ComparisonModal';
import { MyBookingsView } from './components/MyBookingsView';
import { Navbar, type StudentNavTab } from './components/Navbar';
import { PartnerPortal } from './components/PartnerPortal';
import { PropertyBookingModal } from './components/PropertyBookingModal';
import { Step1Profile } from './components/Step1Profile';
import { Step2College } from './components/Step2College';
import { Step3Discovery } from './components/Step3Discovery';
import { COLLEGES, SEED_PROPERTIES } from './data/locusData';
import type {
  BookingRequest,
  FilterPreferences,
  PartnerUser,
  PGProperty,
  StudentProfile,
} from './types/locus';
import { computeBudgetMaxRent, createDefaultFilters } from './utils/housingLogic';

const INITIAL_PROFILE: StudentProfile = {
  fullName: '',
  email: '',
  phone: '',
  gender: 'Male',
  lookingFor: ['PG', 'Hostel'],
  bothOrAny: true,
  expectedMoveIn: '2026-12-01',
  targetBudget: '₹9,000 – ₹15,000/mo',
};

function readInitialMode(): { portal: 'student' | 'partner'; tab: StudentNavTab } {
  const hash = window.location.hash;
  const path = window.location.pathname;
  if (hash.startsWith('#/partner') || path.startsWith('/partner')) {
    return { portal: 'partner', tab: 'step1' };
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    return { portal: 'student', tab: 'discover' };
  }
  try {
    const savedTab = localStorage.getItem('locus_active_tab') as StudentNavTab | null;
    if (savedTab && ['step1', 'step2', 'discover', 'bookings'].includes(savedTab)) {
      return { portal: 'student', tab: savedTab };
    }
  } catch {
    // ignore storage read error
  }
  return { portal: 'student', tab: 'step1' };
}

export default function App() {
  const initialRoute = readInitialMode();
  const [portalMode, setPortalMode] = useState<'student' | 'partner'>(initialRoute.portal);
  const [activeTab, setActiveTab] = useState<StudentNavTab>(initialRoute.tab);

  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('locus_student_profile');
      return saved ? { ...INITIAL_PROFILE, ...JSON.parse(saved) } : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(() => {
    try {
      return localStorage.getItem('locus_selected_college') || 'msrit';
    } catch {
      return 'msrit';
    }
  });

  const [preferences, setPreferences] = useState<FilterPreferences>(() =>
    createDefaultFilters(computeBudgetMaxRent(INITIAL_PROFILE.targetBudget)),
  );

  const [properties, setProperties] = useState<PGProperty[]>(SEED_PROPERTIES);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('locus_saved_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [bookingProperty, setBookingProperty] = useState<PGProperty | null>(null);

  // Partner Auth State
  const [partnerToken, setPartnerToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('locus_partner_token');
    } catch {
      return null;
    }
  });
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);

  // Persist student progress
  useEffect(() => {
    try {
      localStorage.setItem('locus_student_profile', JSON.stringify(studentProfile));
    } catch {
      // ignore
    }
  }, [studentProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('locus_selected_college', selectedCollegeId);
    } catch {
      // ignore
    }
  }, [selectedCollegeId]);

  useEffect(() => {
    try {
      localStorage.setItem('locus_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('locus_saved_ids', JSON.stringify(savedIds));
    } catch {
      // ignore
    }
  }, [savedIds]);

  // Sync hash navigation for Partner Portal
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith('#/partner')) {
        setPortalMode('partner');
      } else {
        setPortalMode('student');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Load initial properties, bookings, and verify stored partner token
  useEffect(() => {
    let active = true;
    async function loadInitial() {
      try {
        const [propRes, bookRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/bookings'),
        ]);
        if (propRes.ok && active) {
          const data = await propRes.json();
          if (Array.isArray(data.properties)) {
            setProperties(data.properties);
          }
        }
        if (bookRes.ok && active) {
          const data = await bookRes.json();
          if (Array.isArray(data.bookings)) {
            setBookings(data.bookings);
          }
        }
      } catch {
        // fallback to seed properties already set
      } finally {
        if (active) setPropertiesLoading(false);
      }

      if (partnerToken && active) {
        try {
          const meRes = await fetch('/api/partner/me', {
            headers: { Authorization: `Bearer ${partnerToken}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (active) setPartnerUser(meData.partner);
          } else {
            localStorage.removeItem('locus_partner_token');
            if (active) setPartnerToken(null);
          }
        } catch {
          // ignore
        }
      }
    }
    loadInitial();
    return () => {
      active = false;
    };
  }, [partnerToken]);

  const selectedCollege =
    COLLEGES.find((c) => c.id === selectedCollegeId) ?? COLLEGES[0];

  const comparedProperties = properties.filter((p) => compareIds.includes(p.id));

  const openPartnerPortal = () => {
    window.location.hash = '#/partner';
    setPortalMode('partner');
  };

  const exitPartnerPortal = () => {
    window.location.hash = '#/';
    setPortalMode('student');
  };

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (res.ok) {
      const data = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === data.booking.id ? data.booking : b)),
      );
    }
  };

  if (portalMode === 'partner') {
    return (
      <PartnerPortal
        partner={partnerUser}
        token={partnerToken}
        properties={properties}
        bookings={bookings}
        onAuthenticated={(token, user) => {
          localStorage.setItem('locus_partner_token', token);
          setPartnerToken(token);
          setPartnerUser(user);
        }}
        onLogout={() => {
          localStorage.removeItem('locus_partner_token');
          setPartnerToken(null);
          setPartnerUser(null);
        }}
        onExitPortal={exitPartnerPortal}
        onPropertyUpdated={(updated) => {
          setProperties((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p)),
          );
        }}
        onPropertyCreated={(created) => {
          setProperties((prev) => [created, ...prev]);
        }}
        onBookingUpdated={(updated) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b)),
          );
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900">
      <Navbar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onOpenPartnerPortal={openPartnerPortal}
        selectedCollegeCode={selectedCollege.code}
        bookingsCount={bookings.filter((b) => b.status !== 'cancelled').length}
        compareCount={compareIds.length}
        onOpenCompare={() => setCompareModalOpen(true)}
      />

      <main className="pb-20">
        {activeTab === 'step1' && (
          <Step1Profile
            profile={studentProfile}
            onChange={setStudentProfile}
            onContinue={() => {
              setPreferences((prev) => ({
                ...prev,
                maxRent: computeBudgetMaxRent(studentProfile.targetBudget),
              }));
              setActiveTab('step2');
            }}
          />
        )}

        {activeTab === 'step2' && (
          <Step2College
            selectedCollegeId={selectedCollegeId}
            onSelectCollege={(id) => {
              setSelectedCollegeId(id);
              setPreferences((prev) => ({ ...prev, gateId: 'all' }));
            }}
            onBack={() => setActiveTab('step1')}
            onContinue={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'discover' && (
          <Step3Discovery
            college={selectedCollege}
            properties={properties}
            loading={propertiesLoading}
            preferences={preferences}
            onChangePreferences={setPreferences}
            onResetPreferences={() => setPreferences(createDefaultFilters(25000))}
            onChangeCollege={() => setActiveTab('step2')}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
            onOpenCompareModal={() => setCompareModalOpen(true)}
            onOpenBookingModal={(pg) => setBookingProperty(pg)}
          />
        )}

        {activeTab === 'bookings' && (
          <MyBookingsView
            bookings={bookings}
            onCancelBooking={handleCancelBooking}
            onExplorePGs={() => setActiveTab('discover')}
          />
        )}
      </main>

      <ComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        properties={comparedProperties}
        onRemoveProperty={(id) =>
          setCompareIds((prev) => prev.filter((x) => x !== id))
        }
        onBookProperty={(pg) => {
          setCompareModalOpen(false);
          setBookingProperty(pg);
        }}
      />

      <PropertyBookingModal
        key={bookingProperty?.id || 'closed'}
        property={bookingProperty}
        studentProfile={studentProfile}
        onClose={() => setBookingProperty(null)}
        onBookingCreated={(booking, updatedProp) => {
          setBookings((prev) => [booking, ...prev]);
          if (updatedProp) {
            setProperties((prev) =>
              prev.map((p) => (p.id === updatedProp.id ? updatedProp : p)),
            );
          }
        }}
        onViewBookings={() => setActiveTab('bookings')}
      />
    </div>
  );
}
