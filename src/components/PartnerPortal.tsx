import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Lock,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { COLLEGES, VERIFICATION_TIER_LABELS } from '../data/locusData';
import type {
  AuditStatus,
  BookingRequest,
  PartnerUser,
  PGProperty,
  VerificationTier,
} from '../types/locus';
import {
  computePartnerMetrics,
  formatINR,
  validatePartnerCredentials,
} from '../utils/housingLogic';

interface PartnerPortalProps {
  partner: PartnerUser | null;
  token: string | null;
  properties: PGProperty[];
  bookings: BookingRequest[];
  onAuthenticated: (token: string, partner: PartnerUser) => void;
  onLogout: () => void;
  onExitPortal: () => void;
  onPropertyUpdated: (updated: PGProperty) => void;
  onPropertyCreated: (created: PGProperty) => void;
  onBookingUpdated: (updated: BookingRequest) => void;
}

type PartnerSection = 'overview' | 'bookings';
type PropertyTabFilter = 'all' | 'college_owned' | 'college_verified' | 'pending';

export function PartnerPortal({
  partner,
  token,
  properties,
  bookings,
  onAuthenticated,
  onLogout,
  onExitPortal,
  onPropertyUpdated,
  onPropertyCreated,
  onBookingUpdated,
}: PartnerPortalProps) {
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [collegeId, setCollegeId] = useState('msrit');
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [authServerError, setAuthServerError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Dashboard state
  const [activeSection, setActiveSection] = useState<PartnerSection>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tabFilter, setTabFilter] = useState<PropertyTabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Add property form state
  const [newPropName, setNewPropName] = useState('');
  const [newPropNeighborhood, setNewPropNeighborhood] = useState('MSR Nagar');
  const [newPropCollegeId, setNewPropCollegeId] = useState('msrit');
  const [newPropRent, setNewPropRent] = useState('9500');
  const [newPropDistance, setNewPropDistance] = useState('400');
  const [newPropTier, setNewPropTier] = useState<VerificationTier>('college_verified');
  const [newPropGender, setNewPropGender] = useState<'Boys' | 'Girls' | 'Co-Ed'>('Co-Ed');
  const [newPropError, setNewPropError] = useState('');
  const [newPropSaving, setNewPropSaving] = useState(false);

  const metrics = useMemo(() => computePartnerMetrics(properties), [properties]);

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return properties.filter((pg) => {
      if (tabFilter === 'college_owned' && pg.verificationTier !== 'college_owned') return false;
      if (tabFilter === 'college_verified' && pg.verificationTier !== 'college_verified') {
        return false;
      }
      if (tabFilter === 'pending' && pg.auditStatus === 'verified') return false;
      if (q) {
        const hay = `${pg.name} ${pg.neighborhood} ${pg.collegeId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [properties, tabFilter, searchQuery]);

  const DEMO_PARTNERS: { password: string; user: PartnerUser }[] = [
    {
      password: 'Partner@2026',
      user: {
        id: 'partner-msrit-admin',
        email: 'admin@msrit.locus.edu',
        name: 'Dr. Kavitha Rao',
        organization: 'MSRIT Student Welfare Council',
        collegeId: 'msrit',
        role: 'Campus Welfare Admin',
      },
    },
    {
      password: 'Locus@2026',
      user: {
        id: 'partner-bengaluru-host',
        email: 'partner@locus.edu',
        name: 'Rohan Deshmukh',
        organization: 'Bengaluru Campus Residences',
        collegeId: 'msrit',
        role: 'Property Partner',
      },
    },
  ];

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthServerError('');
    const validation = validatePartnerCredentials(email, password);
    if (authMode === 'register') {
      if (!name.trim() || name.trim().length < 2) {
        validation.name = 'Enter contact full name.';
      }
      if (!organization.trim() || organization.trim().length < 2) {
        validation.organization = 'Enter college or property organization.';
      }
    }
    if (Object.keys(validation).length > 0) {
      setAuthErrors(validation);
      return;
    }

    setAuthErrors({});
    setAuthSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const endpoint = authMode === 'login' ? '/api/partner/login' : '/api/partner/register';
      const payload =
        authMode === 'login'
          ? { email: normalizedEmail, password }
          : {
              email: normalizedEmail,
              password,
              name: name.trim(),
              organization: organization.trim(),
              collegeId,
            };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setAuthServerError(data.error || 'Authentication failed.');
          return;
        }
        onAuthenticated(data.token, data.partner);
        return;
      }
      throw new Error('Non-JSON response from auth endpoint');
    } catch {
      // Fallback for static preview / offline mode
      if (authMode === 'login') {
        let storedLocal: { password: string; user: PartnerUser }[] = [];
        try {
          storedLocal = JSON.parse(localStorage.getItem('locus_local_partners') || '[]');
        } catch {
          storedLocal = [];
        }
        const matched = [...DEMO_PARTNERS, ...storedLocal].find(
          (entry) =>
            entry.user.email.toLowerCase() === normalizedEmail && entry.password === password,
        );
        if (matched) {
          onAuthenticated(`local:${matched.user.id}`, matched.user);
          return;
        }
        setAuthServerError('Invalid partner email or password.');
      } else {
        const newPartner: PartnerUser = {
          id: `partner-${Date.now().toString(36)}`,
          email: normalizedEmail,
          name: name.trim(),
          organization: organization.trim(),
          collegeId,
          role: 'Property Partner',
        };
        try {
          const existing = JSON.parse(localStorage.getItem('locus_local_partners') || '[]');
          localStorage.setItem(
            'locus_local_partners',
            JSON.stringify([...existing, { password, user: newPartner }]),
          );
        } catch {
          // ignore storage error
        }
        onAuthenticated(`local:${newPartner.id}`, newPartner);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleFillDemoPartner = () => {
    setAuthMode('login');
    setAuthErrors({});
    setAuthServerError('');
    setEmail('admin@msrit.locus.edu');
    setPassword('Partner@2026');
  };

  const handleAuditAction = async (propertyId: string, auditStatus: AuditStatus) => {
    if (!token) return;
    if (!token.startsWith('local:')) {
      try {
        const res = await fetch(`/api/properties/${propertyId}/audit`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            auditStatus,
            auditScore: auditStatus === 'verified' ? 95 : undefined,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          onPropertyUpdated(data.property);
          return;
        }
      } catch {
        // fall through to local update
      }
    }
    const existing = properties.find((p) => p.id === propertyId);
    if (existing) {
      onPropertyUpdated({
        ...existing,
        auditStatus,
        auditScore: auditStatus === 'verified' ? 95 : existing.auditScore,
        verificationTier:
          auditStatus === 'verified' && existing.verificationTier === 'standard_pg'
            ? 'college_verified'
            : existing.verificationTier,
      });
    }
  };

  const handleCreateProperty = async (e: FormEvent) => {
    e.preventDefault();
    setNewPropError('');
    if (!newPropName.trim() || newPropName.trim().length < 3) {
      setNewPropError('Enter a property name (at least 3 characters).');
      return;
    }
    const rent = Number(newPropRent);
    if (!Number.isFinite(rent) || rent < 3000) {
      setNewPropError('Enter a valid monthly rent (minimum ₹3,000).');
      return;
    }
    if (!token) return;

    setNewPropSaving(true);
    try {
      if (!token.startsWith('local:')) {
        const res = await fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newPropName.trim(),
            neighborhood: newPropNeighborhood.trim(),
            collegeId: newPropCollegeId,
            startingRent: rent,
            distanceMeters: Number(newPropDistance) || 450,
            verificationTier: newPropTier,
            genderPolicy: newPropGender,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) {
            setNewPropError(data.error || 'Could not save property.');
            return;
          }
          onPropertyCreated(data.property);
          setAddModalOpen(false);
          setNewPropName('');
          return;
        }
      }

      const college = COLLEGES.find((c) => c.id === newPropCollegeId) || COLLEGES[0];
      const gate = college.gates[0];
      const created: PGProperty = {
        id: `pg-${Date.now().toString(36)}`,
        collegeId: college.id,
        name: newPropName.trim(),
        neighborhood: newPropNeighborhood.trim() || college.area,
        address: `${newPropNeighborhood.trim() || college.area}, Bengaluru`,
        gateId: gate.id,
        gateLabel: gate.label,
        distanceMeters: Number(newPropDistance) || 450,
        walkMinutes: Math.max(2, Math.round((Number(newPropDistance) || 450) / 80)),
        verificationTier: newPropTier,
        genderPolicy: newPropGender,
        startingRent: rent,
        deposit: rent * 1.5,
        auditScore: 92,
        auditStatus: partner?.role === 'Campus Welfare Admin' ? 'verified' : 'pending_audit',
        bedsAvailable: 6,
        rating: 4.6,
        reviewCount: 1,
        foodPolicy: ['veg_only', 'fssai_certified'],
        curfewPolicy: '11:00 PM Smart Biometric',
        amenities: ['wifi', 'laundry', 'security_24_7', 'power_backup'],
        roomOptions: [
          { sharing: 'Single', monthlyRent: rent + 4500, deposit: rent * 1.5 + 5000, bedsLeft: 2 },
          { sharing: '2-Sharing', monthlyRent: rent + 1500, deposit: rent * 1.5, bedsLeft: 2 },
          { sharing: '3-Sharing', monthlyRent: rent, deposit: rent * 1.5, bedsLeft: 2 },
        ],
        mapCoords: { x: 24, y: -22 },
        imageUrl: '/src/assets/images/pg_studio_modern_1794843997669.jpg',
        highlights: ['Zero Brokerage', 'Partner Listed Property', '24/7 Security'],
        partnerEmail: partner?.email || 'admin@msrit.locus.edu',
        submittedAt: new Date().toISOString().slice(0, 10),
      };
      onPropertyCreated(created);
      setAddModalOpen(false);
      setNewPropName('');
    } catch {
      setNewPropError('Network error while adding property.');
    } finally {
      setNewPropSaving(false);
    }
  };

  const handleBookingStatus = async (
    bookingId: string,
    status: 'confirmed' | 'cancelled',
  ) => {
    if (!token?.startsWith('local:')) {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          onBookingUpdated(data.booking);
          return;
        }
      } catch {
        // fallback to local state
      }
    }
    const existing = bookings.find((b) => b.id === bookingId);
    if (existing) {
      onBookingUpdated({ ...existing, status });
    }
  };

  // Unauthenticated Partner Login Gate
  if (!partner) {
    return (
      <div className="min-h-screen bg-[#F8F9FC]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#181548] text-white">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-[#181548]">
                LOCUS Partner
              </span>
            </div>
            <button
              type="button"
              onClick={onExitPortal}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to Student App
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1040px] px-4 py-8 sm:px-6 lg:py-14">
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-12">
            {/* Left Info Panel */}
            <div className="flex flex-col justify-between bg-gradient-to-br from-[#14113E] via-[#211C5E] to-[#36338B] p-6 text-white sm:p-8 lg:col-span-5">
              <div>
                <p className="text-xs font-semibold tracking-wider text-indigo-200 uppercase">
                  Accommodation &amp; Verification Portal
                </p>
                <h1 className="mt-3 text-2xl font-bold leading-tight text-balance">
                  Manage campus audits, verified PGs, and student allocations.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-indigo-100/85">
                  Dedicated workspace for College Welfare Councils and verified PG accommodation
                  partners.
                </p>

                <div className="mt-6 space-y-3 text-xs text-indigo-100">
                  <div className="rounded-xl border border-white/15 bg-white/8 p-3.5">
                    <p className="font-semibold text-white">Physical Safety Audit Scores</p>
                    <p className="mt-1 text-indigo-100/80">
                      Review inspection scores and grant official College Verified status.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/8 p-3.5">
                    <p className="font-semibold text-white">Live Student Booking Sync</p>
                    <p className="mt-1 text-indigo-100/80">
                      Confirm incoming bed reservations and campus tour requests in real time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-indigo-200">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Partner Email &amp; Password Authentication Required</span>
              </div>
            </div>

            {/* Right Login / Register Form */}
            <div className="p-6 sm:p-8 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthErrors({});
                      setAuthServerError('');
                    }}
                    className={`h-9 rounded-lg px-4 text-xs font-semibold cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Partner Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthErrors({});
                      setAuthServerError('');
                    }}
                    className={`h-9 rounded-lg px-4 text-xs font-semibold cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Register Partner
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFillDemoPartner}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#36338B] hover:bg-[#36338B]/5 cursor-pointer"
                >
                  Use Demo Admin Credentials
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} noValidate className="mt-6 space-y-4">
                {authMode === 'register' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="partner-name" className="block text-xs font-semibold text-slate-700">
                        Contact Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="partner-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Kavitha Rao"
                        className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus:border-[#36338B] focus:outline-none"
                      />
                      {authErrors.name && (
                        <p className="mt-1 text-xs text-rose-600">{authErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="partner-org" className="block text-xs font-semibold text-slate-700">
                        Institution / PG Group <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="partner-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="MSRIT Welfare Council"
                        className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus:border-[#36338B] focus:outline-none"
                      />
                      {authErrors.organization && (
                        <p className="mt-1 text-xs text-rose-600">{authErrors.organization}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="partner-email" className="block text-xs font-semibold text-slate-700">
                    Partner Email ID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="partner-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@msrit.locus.edu"
                    className={`mt-1 h-11 w-full rounded-xl border px-3.5 text-sm focus:border-[#36338B] focus:outline-none ${
                      authErrors.email ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {authErrors.email && (
                    <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
                      {authErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="partner-password" className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="partner-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className={`mt-1 h-11 w-full rounded-xl border px-3.5 text-sm focus:border-[#36338B] focus:outline-none ${
                      authErrors.password ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {authErrors.password && (
                    <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
                      {authErrors.password}
                    </p>
                  )}
                </div>

                {authMode === 'register' && (
                  <div>
                    <label htmlFor="partner-college" className="block text-xs font-semibold text-slate-700">
                      Primary Campus Hub
                    </label>
                    <select
                      id="partner-college"
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus:border-[#36338B] focus:outline-none"
                    >
                      {COLLEGES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {authServerError && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {authServerError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="h-12 w-full rounded-xl bg-[#36338B] px-5 text-sm font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {authSubmitting
                    ? 'Verifying Credentials...'
                    : authMode === 'login'
                      ? 'Sign In to Partner Portal'
                      : 'Create Partner Account'}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Demo account: <span className="font-mono">admin@msrit.locus.edu</span> /{' '}
                  <span className="font-mono">Partner@2026</span>
                </p>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated Partner Dashboard
  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#14113E] p-5 text-white lg:flex">
        <div>
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#36338B] text-white">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-base font-extrabold tracking-tight">LOCUS Partner</span>
          </div>

          <nav aria-label="Partner portal sidebar" className="mt-8 space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'overview'
                  ? 'bg-[#36338B] text-white font-semibold'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Verification &amp; Audits</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('bookings')}
              className={`flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors cursor-pointer ${
                activeSection === 'bookings'
                  ? 'bg-[#36338B] text-white font-semibold'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Student Bookings
              </span>
              <span className="font-mono text-xs tabular-nums opacity-80">
                {bookings.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="space-y-2 border-t border-white/15 pt-4">
          <div className="px-2">
            <p className="truncate text-xs font-bold text-white">{partner.name}</p>
            <p className="truncate text-[11px] text-indigo-200">{partner.organization}</p>
          </div>
          <button
            type="button"
            onClick={onExitPortal}
            className="flex h-10 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-indigo-100 hover:bg-white/10 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Student Housing App
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-rose-200 hover:bg-white/10 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 flex w-72 flex-col justify-between bg-[#14113E] p-5 text-white">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold">LOCUS Partner</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Close partner menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-6 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('overview');
                    setMobileSidebarOpen(false);
                  }}
                  className="flex h-11 w-full items-center gap-2.5 rounded-xl bg-white/10 px-3 text-sm font-semibold"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Accommodation &amp; Audits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('bookings');
                    setMobileSidebarOpen(false);
                  }}
                  className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-indigo-100"
                >
                  <Calendar className="h-4 w-4" />
                  Student Bookings ({bookings.length})
                </button>
              </nav>
            </div>
            <div className="space-y-2 border-t border-white/15 pt-4">
              <button
                type="button"
                onClick={onExitPortal}
                className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-xs font-medium text-indigo-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Student App
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-xs font-medium text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Partner Top Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open partner sidebar"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                    {partner.organization} Portal
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified Partner
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{partner.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#36338B] px-4 text-xs font-semibold text-white hover:bg-[#29266E] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add New Property
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
          {activeSection === 'overview' ? (
            <>
              {/* KPI Strip */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">Active Partner PGs</p>
                  <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
                    {metrics.activePartnerPGs}
                  </p>
                  <p className="mt-1 text-xs font-bold text-emerald-800">
                    {metrics.collegeOwnedCount} College Owned · {metrics.collegeVerifiedCount}{' '}
                    College Verified
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">Pending Audits</p>
                  <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
                    {metrics.pendingAudits}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    Requires welfare officer sign-off
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">Avg. Audit Score</p>
                  <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
                    {metrics.avgAuditScore}%
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Safety, Wi-Fi &amp; FSSAI compliance
                  </p>
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: `All (${properties.length})` },
                        {
                          id: 'college_owned',
                          label: `College Owned (${metrics.collegeOwnedCount})`,
                        },
                        {
                          id: 'college_verified',
                          label: `College Verified (${metrics.collegeVerifiedCount})`,
                        },
                        { id: 'pending', label: `Pending Audits (${metrics.pendingAudits})` },
                      ] as { id: PropertyTabFilter; label: string }[]
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTabFilter(t.id)}
                        className={`h-9 rounded-lg px-3 text-xs transition-colors cursor-pointer ${
                          t.id === 'college_owned' || t.id === 'college_verified'
                            ? 'font-bold'
                            : 'font-semibold'
                        } ${
                          tabFilter === t.id
                            ? 'bg-[#36338B] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search PGs..."
                      aria-label="Search verification queue"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-[#F8F9FC] pl-8 pr-3 text-xs focus:border-[#36338B] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Responsive Verification Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        <th className="px-4 py-3">Property Details</th>
                        <th className="px-4 py-3">Campus</th>
                        <th className="px-4 py-3">Starting Rent</th>
                        <th className="px-4 py-3">Audit Score</th>
                        <th className="px-4 py-3">Verification Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProperties.map((pg) => (
                        <tr key={pg.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-900">{pg.name}</p>
                            <p className="text-xs text-slate-500">
                              {pg.genderPolicy} · {pg.neighborhood} ·{' '}
                              <span
                                className={
                                  pg.verificationTier === 'college_owned'
                                    ? 'font-bold text-[#36338B]'
                                    : pg.verificationTier === 'college_verified'
                                      ? 'font-bold text-emerald-800'
                                      : ''
                                }
                              >
                                {VERIFICATION_TIER_LABELS[pg.verificationTier]}
                              </span>
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 uppercase">
                            {pg.collegeId}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {formatINR(pg.startingRent)}/mo
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800 tabular-nums">
                            {pg.auditScore}/100
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold">
                            {pg.auditStatus === 'verified' && (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                College Verified
                              </span>
                            )}
                            {pg.auditStatus === 'awaiting_inspection' && (
                              <span className="inline-flex items-center gap-1 text-amber-700">
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                Awaiting Inspection
                              </span>
                            )}
                            {pg.auditStatus === 'pending_audit' && (
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                                Pending Review
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {pg.auditStatus !== 'verified' ? (
                              <button
                                type="button"
                                onClick={() => handleAuditAction(pg.id, 'verified')}
                                className="h-8 rounded-lg bg-[#36338B] px-3 text-xs font-semibold text-white hover:bg-[#29266E] cursor-pointer whitespace-nowrap"
                              >
                                Approve Verification
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAuditAction(pg.id, 'pending_audit')}
                                className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                              >
                                Re-Audit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Partner Student Bookings View */
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-base font-bold text-slate-900">
                  Incoming Student Reservations &amp; Visits
                </h2>
                <p className="text-xs text-slate-500">
                  Approve or manage student bed bookings submitted from the LOCUS discovery map.
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">
                    No student bookings recorded yet.
                  </p>
                ) : (
                  bookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {bk.studentName} · {bk.propertyName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bk.collegeCode} · {bk.sharing} ·{' '}
                          <span className="font-mono font-semibold text-slate-700">
                            {formatINR(bk.monthlyRent)}/mo
                          </span>{' '}
                          · {bk.studentEmail} · {bk.studentPhone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold capitalize text-slate-700">
                          {bk.status.replace('_', ' ')}
                        </span>
                        {bk.status !== 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleBookingStatus(bk.id, 'confirmed')}
                            className="h-8 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                          >
                            Confirm Bed
                          </button>
                        )}
                        {bk.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleBookingStatus(bk.id, 'cancelled')}
                            className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add New Property Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-prop-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 id="add-prop-title" className="text-base font-bold text-slate-900">
                Add New Partner Property
              </h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                aria-label="Close modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} noValidate className="mt-4 space-y-4">
              <div>
                <label htmlFor="new-prop-name" className="block text-xs font-semibold text-slate-700">
                  Property Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="new-prop-name"
                  type="text"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  placeholder="e.g. Horizon Scholar Residency"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#36338B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-prop-college" className="block text-xs font-semibold text-slate-700">
                    Nearby College
                  </label>
                  <select
                    id="new-prop-college"
                    value={newPropCollegeId}
                    onChange={(e) => setNewPropCollegeId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#36338B] focus:outline-none"
                  >
                    {COLLEGES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="new-prop-area" className="block text-xs font-semibold text-slate-700">
                    Neighborhood
                  </label>
                  <input
                    id="new-prop-area"
                    type="text"
                    value={newPropNeighborhood}
                    onChange={(e) => setNewPropNeighborhood(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#36338B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-prop-rent" className="block text-xs font-semibold text-slate-700">
                    Starting Rent (₹/mo)
                  </label>
                  <input
                    id="new-prop-rent"
                    type="number"
                    value={newPropRent}
                    onChange={(e) => setNewPropRent(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm tabular-nums focus:border-[#36338B] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="new-prop-dist" className="block text-xs font-semibold text-slate-700">
                    Distance to Gate (m)
                  </label>
                  <input
                    id="new-prop-dist"
                    type="number"
                    value={newPropDistance}
                    onChange={(e) => setNewPropDistance(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm tabular-nums focus:border-[#36338B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-prop-tier" className="block text-xs font-semibold text-slate-700">
                    Verification Tier
                  </label>
                  <select
                    id="new-prop-tier"
                    value={newPropTier}
                    onChange={(e) => setNewPropTier(e.target.value as VerificationTier)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#36338B] focus:outline-none"
                  >
                    <option value="college_verified">College Verified PG</option>
                    <option value="college_owned">College Owned Hostel</option>
                    <option value="managed_apartment">Managed Apartment</option>
                    <option value="standard_pg">Standard PG</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="new-prop-gender" className="block text-xs font-semibold text-slate-700">
                    Occupancy Policy
                  </label>
                  <select
                    id="new-prop-gender"
                    value={newPropGender}
                    onChange={(e) =>
                      setNewPropGender(e.target.value as 'Boys' | 'Girls' | 'Co-Ed')
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#36338B] focus:outline-none"
                  >
                    <option value="Co-Ed">Co-Ed</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                  </select>
                </div>
              </div>

              {newPropError && (
                <p role="alert" className="text-xs font-semibold text-rose-600">
                  {newPropError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPropSaving}
                  className="h-10 rounded-xl bg-[#36338B] px-5 text-xs font-semibold text-white hover:bg-[#29266E] cursor-pointer"
                >
                  {newPropSaving ? 'Saving...' : 'Publish Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
