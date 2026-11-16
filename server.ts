import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { COLLEGES, PROPERTY_IMAGES, SEED_PROPERTIES } from './src/data/locusData.ts';
import type {
  AuditStatus,
  BookingRequest,
  PartnerUser,
  PGProperty,
} from './src/types/locus.ts';

interface StoredPartnerAccount extends PartnerUser {
  passwordHash: string;
}

interface StoreState {
  partners: StoredPartnerAccount[];
  properties: PGProperty[];
  bookings: BookingRequest[];
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'locus-store.json');
const TOKEN_SECRET = process.env.LOCUS_AUTH_SECRET || 'locus-dev-partner-secret-2026';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`locus:${password}`).digest('hex');
}

function createSeedStore(): StoreState {
  const partners: StoredPartnerAccount[] = [
    {
      id: 'partner-msrit-admin',
      email: 'admin@msrit.locus.edu',
      name: 'Dr. Kavitha Rao',
      organization: 'MSRIT Student Welfare Council',
      collegeId: 'msrit',
      role: 'Campus Welfare Admin',
      passwordHash: hashPassword('Partner@2026'),
    },
    {
      id: 'partner-bengaluru-host',
      email: 'partner@locus.edu',
      name: 'Rohan Deshmukh',
      organization: 'Bengaluru Campus Residences',
      collegeId: 'msrit',
      role: 'Property Partner',
      passwordHash: hashPassword('Locus@2026'),
    },
  ];

  const bookings: BookingRequest[] = [
    {
      id: 'bk-seed-101',
      propertyId: 'pg-gokula-living',
      propertyName: 'Gokula Student Living',
      collegeId: 'msrit',
      collegeCode: 'MSRIT',
      studentName: 'Ananya Sharma',
      studentEmail: 'ananya.s@msrit.edu',
      studentPhone: '+91 98450 22190',
      sharing: '2-Sharing',
      monthlyRent: 10000,
      deposit: 15000,
      moveInDate: '2026-12-01',
      kind: 'reserve_bed',
      status: 'confirmed',
      createdAt: '2026-11-12T09:30:00.000Z',
    },
    {
      id: 'bk-seed-102',
      propertyId: 'pg-ramaiah-residency',
      propertyName: 'Ramaiah Residency PG',
      collegeId: 'msrit',
      collegeCode: 'MSRIT',
      studentName: 'Karthik Reddy',
      studentEmail: 'karthik.r@msrit.edu',
      studentPhone: '+91 99001 44521',
      sharing: 'Single',
      monthlyRent: 15500,
      deposit: 22000,
      moveInDate: '2026-12-05',
      visitSlot: 'Tomorrow, 4:00 PM',
      kind: 'schedule_visit',
      status: 'visit_scheduled',
      createdAt: '2026-11-14T14:15:00.000Z',
    },
  ];

  return {
    partners,
    properties: SEED_PROPERTIES,
    bookings,
  };
}

function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial = createSeedStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoreState;
    if (!parsed.properties || !parsed.partners || !parsed.bookings) {
      throw new Error('Invalid store shape');
    }
    return parsed;
  } catch {
    const initial = createSeedStore();
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
    } catch {
      // Fallback gracefully to in-memory store if filesystem is read-only
    }
    return initial;
  }
}

function saveStore(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Keep in-memory state if filesystem write is restricted
  }
}

function signToken(partner: PartnerUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: partner.id,
      email: partner.email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string | undefined): { id: string; email: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      id: string;
      email: string;
      exp: number;
    };
    if (decoded.exp < Date.now()) return null;
    return { id: decoded.id, email: decoded.email };
  } catch {
    return null;
  }
}

function sanitizePartner(p: StoredPartnerAccount): PartnerUser {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    organization: p.organization,
    collegeId: p.collegeId,
    role: p.role,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  let store = loadStore();

  function getAuthenticatedPartner(req: express.Request): PartnerUser | null {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const claims = verifyToken(token);
    if (!claims) return null;
    const found = store.partners.find((p) => p.id === claims.id && p.email === claims.email);
    return found ? sanitizePartner(found) : null;
  }

  // Partner Auth Routes
  app.post('/api/partner/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid partner email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const partner = store.partners.find((p) => p.email.toLowerCase() === email);
    if (!partner || partner.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid partner email or password.' });
    }

    const user = sanitizePartner(partner);
    const token = signToken(user);
    return res.json({ token, partner: user });
  });

  app.post('/api/partner/register', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();
    const organization = String(req.body?.organization || '').trim();
    const collegeId = String(req.body?.collegeId || 'msrit');

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Partner contact name is required.' });
    }
    if (!organization || organization.length < 2) {
      return res.status(400).json({ error: 'Organization or PG name is required.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (store.partners.some((p) => p.email.toLowerCase() === email)) {
      return res.status(409).json({ error: 'A partner account with this email already exists.' });
    }

    const newPartner: StoredPartnerAccount = {
      id: `partner-${crypto.randomBytes(4).toString('hex')}`,
      email,
      name,
      organization,
      collegeId,
      role: 'Property Partner',
      passwordHash: hashPassword(password),
    };
    store.partners.push(newPartner);
    saveStore(store);

    const user = sanitizePartner(newPartner);
    const token = signToken(user);
    return res.status(201).json({ token, partner: user });
  });

  app.get('/api/partner/me', (req, res) => {
    const partner = getAuthenticatedPartner(req);
    if (!partner) {
      return res.status(401).json({ error: 'Unauthorized partner session.' });
    }
    return res.json({ partner });
  });

  // Properties Routes
  app.get('/api/properties', (req, res) => {
    const collegeId = typeof req.query.collegeId === 'string' ? req.query.collegeId : undefined;
    const list = collegeId
      ? store.properties.filter((p) => p.collegeId === collegeId)
      : store.properties;
    return res.json({ properties: list });
  });

  app.post('/api/properties', (req, res) => {
    const partner = getAuthenticatedPartner(req);
    if (!partner) {
      return res.status(401).json({ error: 'Partner authentication required.' });
    }

    const body = req.body || {};
    const college = COLLEGES.find((c) => c.id === body.collegeId) || COLLEGES[0];
    const name = String(body.name || '').trim();
    const neighborhood = String(body.neighborhood || college.area).trim();
    const address = String(body.address || `${neighborhood}, Bengaluru`).trim();
    const startingRent = Number(body.startingRent);
    const deposit = Number(body.deposit) || startingRent * 1.5;
    const distanceMeters = Number(body.distanceMeters) || 450;

    if (!name || name.length < 3) {
      return res.status(400).json({ error: 'Property name must be at least 3 characters.' });
    }
    if (!Number.isFinite(startingRent) || startingRent < 3000) {
      return res.status(400).json({ error: 'Starting rent must be at least ₹3,000/month.' });
    }

    const gate = college.gates[0];
    const angle = (store.properties.length * 1.37) % (Math.PI * 2);
    const radius = Math.min(62, Math.max(20, Math.round(distanceMeters / 16)));
    const newProperty: PGProperty = {
      id: `pg-${crypto.randomBytes(4).toString('hex')}`,
      collegeId: college.id,
      name,
      neighborhood,
      address,
      gateId: gate.id,
      gateLabel: gate.label,
      distanceMeters,
      walkMinutes: Math.max(2, Math.round(distanceMeters / 80)),
      verificationTier: body.verificationTier || 'college_verified',
      genderPolicy: body.genderPolicy || 'Co-Ed',
      startingRent,
      deposit,
      auditScore: Number(body.auditScore) || 92,
      auditStatus: partner.role === 'Campus Welfare Admin' ? 'verified' : 'pending_audit',
      bedsAvailable: Number(body.bedsAvailable) || 6,
      rating: 4.6,
      reviewCount: 1,
      foodPolicy: Array.isArray(body.foodPolicy) && body.foodPolicy.length > 0
        ? body.foodPolicy
        : ['veg_only', 'fssai_certified'],
      curfewPolicy: String(body.curfewPolicy || '11:00 PM Smart Biometric'),
      amenities: Array.isArray(body.amenities) && body.amenities.length > 0
        ? body.amenities
        : ['wifi', 'laundry', 'security_24_7', 'power_backup'],
      roomOptions: [
        { sharing: 'Single', monthlyRent: startingRent + 4500, deposit: deposit + 5000, bedsLeft: 2 },
        { sharing: '2-Sharing', monthlyRent: startingRent + 1500, deposit, bedsLeft: 2 },
        { sharing: '3-Sharing', monthlyRent: startingRent, deposit, bedsLeft: 2 },
      ],
      mapCoords: {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      },
      imageUrl: PROPERTY_IMAGES.studio,
      highlights: ['Zero Brokerage', 'Partner Listed Property', '24/7 Security'],
      partnerEmail: partner.email,
      submittedAt: new Date().toISOString().slice(0, 10),
    };

    store.properties.unshift(newProperty);
    saveStore(store);
    return res.status(201).json({ property: newProperty });
  });

  app.patch('/api/properties/:id/audit', (req, res) => {
    const partner = getAuthenticatedPartner(req);
    if (!partner) {
      return res.status(401).json({ error: 'Partner authentication required.' });
    }

    const prop = store.properties.find((p) => p.id === req.params.id);
    if (!prop) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const nextStatus = req.body?.auditStatus as AuditStatus | undefined;
    const nextScore = req.body?.auditScore;
    if (nextStatus && ['verified', 'pending_audit', 'awaiting_inspection'].includes(nextStatus)) {
      prop.auditStatus = nextStatus;
      if (nextStatus === 'verified' && prop.verificationTier === 'standard_pg') {
        prop.verificationTier = 'college_verified';
      }
    }
    if (typeof nextScore === 'number' && nextScore >= 50 && nextScore <= 100) {
      prop.auditScore = Math.round(nextScore);
    }

    saveStore(store);
    return res.json({ property: prop });
  });

  // Bookings Routes
  app.get('/api/bookings', (req, res) => {
    const partner = getAuthenticatedPartner(req);
    if (partner) {
      return res.json({ bookings: store.bookings });
    }
    const studentEmail = typeof req.query.studentEmail === 'string' ? req.query.studentEmail.trim().toLowerCase() : '';
    const filtered = studentEmail
      ? store.bookings.filter((b) => b.studentEmail.toLowerCase() === studentEmail)
      : store.bookings;
    return res.json({ bookings: filtered });
  });

  app.post('/api/bookings', (req, res) => {
    const body = req.body || {};
    const prop = store.properties.find((p) => p.id === body.propertyId);
    if (!prop) {
      return res.status(404).json({ error: 'Selected property was not found.' });
    }

    const studentName = String(body.studentName || '').trim();
    const studentEmail = String(body.studentEmail || '').trim();
    const studentPhone = String(body.studentPhone || '').trim();
    const sharing = body.sharing || prop.roomOptions[0]?.sharing || '2-Sharing';
    const moveInDate = String(body.moveInDate || '').trim();
    const kind = body.kind === 'schedule_visit' ? 'schedule_visit' : 'reserve_bed';

    if (!studentName || studentName.length < 2) {
      return res.status(400).json({ error: 'Student name is required.' });
    }
    if (!studentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      return res.status(400).json({ error: 'Valid student email is required.' });
    }
    if (!studentPhone || studentPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required.' });
    }
    if (!moveInDate) {
      return res.status(400).json({ error: 'Move-in date is required.' });
    }

    const roomOpt = prop.roomOptions.find((r) => r.sharing === sharing) || prop.roomOptions[0];
    const college = COLLEGES.find((c) => c.id === prop.collegeId);

    const newBooking: BookingRequest = {
      id: `bk-${crypto.randomBytes(4).toString('hex')}`,
      propertyId: prop.id,
      propertyName: prop.name,
      collegeId: prop.collegeId,
      collegeCode: college?.code || prop.collegeId.toUpperCase(),
      studentName,
      studentEmail,
      studentPhone,
      sharing,
      monthlyRent: roomOpt ? roomOpt.monthlyRent : prop.startingRent,
      deposit: roomOpt ? roomOpt.deposit : prop.deposit,
      moveInDate,
      visitSlot: kind === 'schedule_visit' ? String(body.visitSlot || 'Tomorrow, 11:00 AM') : undefined,
      kind,
      status: kind === 'schedule_visit' ? 'visit_scheduled' : 'confirmed',
      createdAt: new Date().toISOString(),
    };

    if (kind === 'reserve_bed' && prop.bedsAvailable > 0) {
      prop.bedsAvailable -= 1;
    }

    store.bookings.unshift(newBooking);
    saveStore(store);
    return res.status(201).json({ booking: newBooking, property: prop });
  });

  app.patch('/api/bookings/:id', (req, res) => {
    const booking = store.bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const nextStatus = req.body?.status;
    if (nextStatus && ['confirmed', 'visit_scheduled', 'cancelled'].includes(nextStatus)) {
      if (nextStatus === 'cancelled' && booking.status === 'confirmed' && booking.kind === 'reserve_bed') {
        const prop = store.properties.find((p) => p.id === booking.propertyId);
        if (prop) prop.bedsAvailable += 1;
      }
      booking.status = nextStatus;
      saveStore(store);
    }
    return res.json({ booking });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LOCUS server running on http://localhost:${PORT}`);
  });
}

startServer();
