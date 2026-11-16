export type GenderOption = 'Male' | 'Female' | 'Other';
export type AccommodationInterest = 'PG' | 'Hostel' | 'Shared Flat';
export type BudgetTier =
  | '₹6,000 – ₹9,000/mo'
  | '₹9,000 – ₹15,000/mo'
  | '₹15,000 – ₹22,000/mo'
  | '₹22,000+/mo';

export interface StudentProfile {
  fullName: string;
  email: string;
  phone: string;
  gender: GenderOption;
  lookingFor: AccommodationInterest[];
  bothOrAny: boolean;
  expectedMoveIn: string;
  targetBudget: BudgetTier;
}

export interface CollegeGate {
  id: string;
  label: string;
  direction: string;
  x: number;
  y: number;
}

export interface College {
  id: string;
  code: string;
  name: string;
  shortName: string;
  area: string;
  city: string;
  popular: boolean;
  isOfficialPartner: boolean;
  highlightLabel: string;
  bedsAvailableLabel: string;
  distanceNote: string;
  transitLabel: string;
  streets: string[];
  gates: CollegeGate[];
}

export type VerificationTier =
  | 'college_owned'
  | 'college_verified'
  | 'standard_pg'
  | 'managed_apartment';

export type AuditStatus = 'verified' | 'pending_audit' | 'awaiting_inspection';

export type SharingType = 'Single' | '2-Sharing' | '3-Sharing' | '4+ Sharing';

export type FoodPolicy =
  | 'veg_only'
  | 'non_veg_available'
  | 'self_cooking'
  | 'fssai_certified';

export type AmenityKey =
  | 'wifi'
  | 'laundry'
  | 'security_24_7'
  | 'biometric'
  | 'gym'
  | 'power_backup'
  | 'ac'
  | 'study_lounge'
  | 'housekeeping';

export interface RoomOption {
  sharing: SharingType;
  monthlyRent: number;
  deposit: number;
  bedsLeft: number;
}

export interface PGProperty {
  id: string;
  collegeId: string;
  name: string;
  neighborhood: string;
  address: string;
  gateId: string;
  gateLabel: string;
  distanceMeters: number;
  walkMinutes: number;
  verificationTier: VerificationTier;
  genderPolicy: 'Boys' | 'Girls' | 'Co-Ed';
  startingRent: number;
  deposit: number;
  auditScore: number;
  auditStatus: AuditStatus;
  bedsAvailable: number;
  rating: number;
  reviewCount: number;
  foodPolicy: FoodPolicy[];
  curfewPolicy: string;
  amenities: AmenityKey[];
  roomOptions: RoomOption[];
  mapCoords: { x: number; y: number };
  imageUrl: string;
  highlights: string[];
  partnerEmail: string;
  submittedAt: string;
}

export type SortOption = 'nearest' | 'price_asc' | 'price_desc' | 'rating' | 'audit_score';

export interface FilterPreferences {
  searchQuery: string;
  sortBy: SortOption;
  maxRent: number;
  accommodationType: 'all' | VerificationTier;
  maxDistanceMeters: number | null;
  gateId: string | 'all';
  sharing: SharingType | 'all';
  foodPolicies: FoodPolicy[];
  amenities: AmenityKey[];
  genderFilter: 'all' | 'Boys' | 'Girls' | 'Co-Ed';
}

export type BookingKind = 'reserve_bed' | 'schedule_visit';
export type BookingStatus = 'confirmed' | 'visit_scheduled' | 'cancelled';

export interface BookingRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  collegeId: string;
  collegeCode: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  sharing: SharingType;
  monthlyRent: number;
  deposit: number;
  moveInDate: string;
  visitSlot?: string;
  kind: BookingKind;
  status: BookingStatus;
  createdAt: string;
}

export interface PartnerUser {
  id: string;
  email: string;
  name: string;
  organization: string;
  collegeId: string;
  role: 'Campus Welfare Admin' | 'Property Partner';
}
