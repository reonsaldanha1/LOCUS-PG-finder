import type {
  BudgetTier,
  FilterPreferences,
  PGProperty,
  SharingType,
  StudentProfile,
} from '../types/locus';

export function computeBudgetMaxRent(budget: BudgetTier): number {
  switch (budget) {
    case '₹6,000 – ₹9,000/mo':
      return 9500;
    case '₹9,000 – ₹15,000/mo':
      return 15000;
    case '₹15,000 – ₹22,000/mo':
      return 22000;
    case '₹22,000+/mo':
      return 30000;
  }
}

export function createDefaultFilters(maxRent = 15000): FilterPreferences {
  return {
    searchQuery: '',
    sortBy: 'nearest',
    maxRent,
    accommodationType: 'all',
    maxDistanceMeters: null,
    gateId: 'all',
    sharing: 'all',
    foodPolicies: [],
    amenities: [],
    genderFilter: 'all',
  };
}

export function getRentForSharing(property: PGProperty, sharing: SharingType | 'all'): number {
  if (sharing === 'all') {
    return property.startingRent;
  }
  const match = property.roomOptions.find((opt) => opt.sharing === sharing);
  return match ? match.monthlyRent : property.startingRent;
}

export function filterAndSortProperties(
  properties: PGProperty[],
  collegeId: string,
  preferences: FilterPreferences,
  includePending = false,
): PGProperty[] {
  const query = preferences.searchQuery.trim().toLowerCase();

  const filtered = properties.filter((pg) => {
    if (pg.collegeId !== collegeId) return false;
    if (!includePending && pg.auditStatus !== 'verified') return false;

    if (query) {
      const hay = `${pg.name} ${pg.neighborhood} ${pg.address} ${pg.gateLabel}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }

    if (
      preferences.accommodationType !== 'all' &&
      pg.verificationTier !== preferences.accommodationType
    ) {
      return false;
    }

    if (preferences.genderFilter !== 'all' && pg.genderPolicy !== preferences.genderFilter) {
      if (pg.genderPolicy !== 'Co-Ed') return false;
    }

    if (preferences.gateId !== 'all' && pg.gateId !== preferences.gateId) {
      return false;
    }

    if (
      preferences.maxDistanceMeters !== null &&
      pg.distanceMeters > preferences.maxDistanceMeters
    ) {
      return false;
    }

    if (preferences.sharing !== 'all') {
      const hasSharing = pg.roomOptions.some((opt) => opt.sharing === preferences.sharing);
      if (!hasSharing) return false;
    }

    const effectiveRent = getRentForSharing(pg, preferences.sharing);
    if (preferences.maxRent < 25000 && effectiveRent > preferences.maxRent) {
      return false;
    }

    if (preferences.foodPolicies.length > 0) {
      const hasAllFood = preferences.foodPolicies.every((fp) => pg.foodPolicy.includes(fp));
      if (!hasAllFood) return false;
    }

    if (preferences.amenities.length > 0) {
      const hasAllAmenities = preferences.amenities.every((am) => pg.amenities.includes(am));
      if (!hasAllAmenities) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (preferences.sortBy) {
      case 'nearest':
        return a.distanceMeters - b.distanceMeters;
      case 'price_asc':
        return (
          getRentForSharing(a, preferences.sharing) -
          getRentForSharing(b, preferences.sharing)
        );
      case 'price_desc':
        return (
          getRentForSharing(b, preferences.sharing) -
          getRentForSharing(a, preferences.sharing)
        );
      case 'rating':
        return b.rating - a.rating;
      case 'audit_score':
        return b.auditScore - a.auditScore;
    }
  });

  return sorted;
}

export interface BookingEstimate {
  monthlyRent: number;
  deposit: number;
  brokerageFee: number;
  brokerageSaved: number;
  totalMoveInDue: number;
}

export function computeBookingEstimate(
  property: PGProperty,
  sharing: SharingType,
): BookingEstimate {
  const option =
    property.roomOptions.find((opt) => opt.sharing === sharing) ?? property.roomOptions[0];
  const monthlyRent = option ? option.monthlyRent : property.startingRent;
  const deposit = option ? option.deposit : property.deposit;
  return {
    monthlyRent,
    deposit,
    brokerageFee: 0,
    brokerageSaved: monthlyRent,
    totalMoveInDue: monthlyRent + deposit,
  };
}

export function validateStep1Profile(profile: StudentProfile): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!profile.fullName.trim() || profile.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }
  if (!profile.bothOrAny && profile.lookingFor.length === 0) {
    errors.lookingFor = 'Select at least one accommodation type or enable Both / Any.';
  }
  if (!profile.expectedMoveIn) {
    errors.expectedMoveIn = 'Select your expected move-in date.';
  }
  return errors;
}

export function validatePartnerCredentials(
  email: string,
  password: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid partner email address.';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

export interface PartnerMetrics {
  activePartnerPGs: number;
  pendingAudits: number;
  avgAuditScore: number;
  collegeOwnedCount: number;
  collegeVerifiedCount: number;
}

export function computePartnerMetrics(properties: PGProperty[]): PartnerMetrics {
  const verified = properties.filter((p) => p.auditStatus === 'verified');
  const pending = properties.filter((p) => p.auditStatus !== 'verified');
  const avgAuditScore =
    properties.length > 0
      ? Math.round(properties.reduce((sum, p) => sum + p.auditScore, 0) / properties.length)
      : 0;
  return {
    activePartnerPGs: verified.length,
    pendingAudits: pending.length,
    avgAuditScore,
    collegeOwnedCount: properties.filter((p) => p.verificationTier === 'college_owned').length,
    collegeVerifiedCount: properties.filter((p) => p.verificationTier === 'college_verified')
      .length,
  };
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
