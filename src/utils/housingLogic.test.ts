import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PROPERTIES } from '../data/locusData';
import {
  computeBookingEstimate,
  computeBudgetMaxRent,
  computePartnerMetrics,
  createDefaultFilters,
  filterAndSortProperties,
  validatePartnerCredentials,
  validateStep1Profile,
} from './housingLogic';

test('filterAndSortProperties filters by college, maxRent, distance, and amenities', () => {
  const basePrefs = createDefaultFilters(11000);
  const msritUnder11k = filterAndSortProperties(SEED_PROPERTIES, 'msrit', basePrefs);
  assert.ok(msritUnder11k.length > 0);
  for (const pg of msritUnder11k) {
    assert.equal(pg.collegeId, 'msrit');
    assert.equal(pg.auditStatus, 'verified');
    assert.ok(pg.startingRent <= 11000);
  }

  const closeWithAC = filterAndSortProperties(SEED_PROPERTIES, 'msrit', {
    ...createDefaultFilters(25000),
    maxDistanceMeters: 500,
    amenities: ['biometric', 'ac'],
  });
  assert.equal(closeWithAC.length, 1);
  assert.equal(closeWithAC[0].id, 'pg-ramaiah-residency');
});

test('filterAndSortProperties sorts by price ascending and rating descending', () => {
  const byPrice = filterAndSortProperties(SEED_PROPERTIES, 'msrit', {
    ...createDefaultFilters(25000),
    sortBy: 'price_asc',
  });
  for (let i = 1; i < byPrice.length; i++) {
    assert.ok(byPrice[i].startingRent >= byPrice[i - 1].startingRent);
  }

  const byRating = filterAndSortProperties(SEED_PROPERTIES, 'msrit', {
    ...createDefaultFilters(25000),
    sortBy: 'rating',
  });
  for (let i = 1; i < byRating.length; i++) {
    assert.ok(byRating[i].rating <= byRating[i - 1].rating);
  }
});

test('computeBookingEstimate returns zero brokerage and correct move-in total', () => {
  const gokula = SEED_PROPERTIES.find((p) => p.id === 'pg-gokula-living');
  assert.ok(gokula);
  const estimate = computeBookingEstimate(gokula, '2-Sharing');
  assert.equal(estimate.monthlyRent, 10000);
  assert.equal(estimate.deposit, 15000);
  assert.equal(estimate.brokerageFee, 0);
  assert.equal(estimate.brokerageSaved, 10000);
  assert.equal(estimate.totalMoveInDue, 25000);
});

test('computeBudgetMaxRent maps Step 1 budget tiers accurately', () => {
  assert.equal(computeBudgetMaxRent('₹6,000 – ₹9,000/mo'), 9500);
  assert.equal(computeBudgetMaxRent('₹9,000 – ₹15,000/mo'), 15000);
  assert.equal(computeBudgetMaxRent('₹15,000 – ₹22,000/mo'), 22000);
});

test('validateStep1Profile catches missing name and empty lookingFor', () => {
  const errs = validateStep1Profile({
    fullName: ' ',
    email: '',
    phone: '',
    gender: 'Male',
    lookingFor: [],
    bothOrAny: false,
    expectedMoveIn: '',
    targetBudget: '₹9,000 – ₹15,000/mo',
  });
  assert.ok(errs.fullName);
  assert.ok(errs.lookingFor);
  assert.ok(errs.expectedMoveIn);

  const valid = validateStep1Profile({
    fullName: 'Aarav Nair',
    email: 'aarav@msrit.edu',
    phone: '9876543210',
    gender: 'Male',
    lookingFor: ['PG'],
    bothOrAny: false,
    expectedMoveIn: '2026-12-01',
    targetBudget: '₹9,000 – ₹15,000/mo',
  });
  assert.deepEqual(valid, {});
});

test('validatePartnerCredentials enforces valid email and 6+ char password', () => {
  const bad = validatePartnerCredentials('invalid-email', '123');
  assert.ok(bad.email);
  assert.ok(bad.password);

  const ok = validatePartnerCredentials('admin@msrit.locus.edu', 'Partner@2026');
  assert.deepEqual(ok, {});
});

test('computePartnerMetrics summarizes active PGs, pending audits, and average score', () => {
  const msritProps = SEED_PROPERTIES.filter((p) => p.collegeId === 'msrit');
  const metrics = computePartnerMetrics(msritProps);
  assert.equal(metrics.activePartnerPGs, 6);
  assert.equal(metrics.pendingAudits, 2);
  assert.ok(metrics.avgAuditScore >= 90);
});
