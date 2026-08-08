import { randomUUID } from 'node:crypto';
import { sessionCache } from './config';

export type ClaimStatus = 'pending' | 'approved';

/**
 * Mirrors `EiApplicationInput` in the frontend's `libs/data-access` --
 * duplicated here rather than imported, matching this repo's existing
 * convention of the BFF keeping its own copy of `EiClaim`/`EiReport`
 * instead of depending on the frontend lib.
 */
export interface EiApplicationInput {
  personal: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    preferredLanguage: 'en' | 'fr';
  };
  separation: {
    employerName: string;
    lastDayWorked: string;
    reasonCode: 'shortage_of_work' | 'dismissal' | 'quit' | 'other';
    payRate: number;
    payPeriod: 'hourly' | 'weekly' | 'biweekly' | 'monthly';
    jobTitle: string;
  };
  otherEmployment: {
    hadOtherEmployers: boolean;
    otherEmployerName?: string;
  };
  eligibility: {
    workersCompensation: boolean;
    pension: boolean;
    selfEmployedOrBusiness: boolean;
    inTrainingProgram: boolean;
  };
  availability: {
    availableImmediately: boolean;
    availableFromDate?: string;
    educationLevel: 'high_school' | 'college_trade' | 'undergraduate' | 'graduate' | 'other';
  };
  directDeposit: {
    enrolling: boolean;
    institutionNumber?: string;
    transitNumber?: string;
    accountNumber?: string;
  };
  declarationAccepted: boolean;
}

export interface EiClaim {
  id: string;
  applicantSub: string;
  status: ClaimStatus;
  weeklyBenefitAmount: number;
  appliedAt: string;
  application?: EiApplicationInput;
}

const WEEKLY_BENEFIT_RATE = 0.55;
const MIN_WEEKLY_BENEFIT = 100;
const MAX_WEEKLY_BENEFIT = 668;
const HOURS_PER_WEEK = 37.5;

/**
 * A deliberately simplified illustrative calculation, not the real EI
 * best-weeks-average formula (which derives insurable earnings from the
 * claimant's best ~14-22 weeks over the last 52) -- this PoT has no
 * payroll history to average over, just the single rate/period entered on
 * the "Employment separation" step. Clamped to a plausible EI-like weekly
 * benefit range so the demo confirmation still reads as realistic.
 */
function weeklyEquivalent(payRate: number, payPeriod: EiApplicationInput['separation']['payPeriod']): number {
  switch (payPeriod) {
    case 'hourly':
      return payRate * HOURS_PER_WEEK;
    case 'weekly':
      return payRate;
    case 'biweekly':
      return payRate / 2;
    case 'monthly':
      return (payRate * 12) / 52;
  }
}

function calculateWeeklyBenefitAmount(application: EiApplicationInput): number {
  const weekly = weeklyEquivalent(application.separation.payRate, application.separation.payPeriod);
  const benefit = weekly * WEEKLY_BENEFIT_RATE;
  return Math.round(Math.min(MAX_WEEKLY_BENEFIT, Math.max(MIN_WEEKLY_BENEFIT, benefit)) * 100) / 100;
}

export interface EiReport {
  id: string;
  applicantSub: string;
  claimId: string;
  periodStart: string;
  periodEnd: string;
  workedHours: number;
  earnings: number;
  submittedAt: string;
}

export async function createClaim(applicantSub: string, application: EiApplicationInput): Promise<EiClaim> {
  const key = sessionCache.buildKey('claims', applicantSub);
  const existing = (await sessionCache.getJson<EiClaim[]>(key)) ?? [];
  const claim: EiClaim = {
    // Not `claim-${claims.length + 1}` -- an id derived from array length
    // breaks once state can outlive a single process (pod restart,
    // multiple replicas), which is exactly what moving this into Redis
    // makes possible.
    id: randomUUID(),
    applicantSub,
    status: 'approved',
    weeklyBenefitAmount: calculateWeeklyBenefitAmount(application),
    appliedAt: new Date().toISOString(),
    application,
  };
  await sessionCache.setJson(key, [...existing, claim]);
  return claim;
}

export async function getClaim(applicantSub: string): Promise<EiClaim | undefined> {
  const claims = (await sessionCache.getJson<EiClaim[]>(sessionCache.buildKey('claims', applicantSub))) ?? [];
  return [...claims].reverse()[0];
}

export async function getReports(claimId: string): Promise<EiReport[]> {
  return (await sessionCache.getJson<EiReport[]>(sessionCache.buildKey('reports', claimId))) ?? [];
}

export async function createReport(
  claimId: string,
  applicantSub: string,
  periodStart: string,
  periodEnd: string,
  workedHours: number,
  earnings: number,
): Promise<EiReport> {
  const key = sessionCache.buildKey('reports', claimId);
  const existing = (await sessionCache.getJson<EiReport[]>(key)) ?? [];
  const report: EiReport = {
    id: randomUUID(),
    applicantSub,
    claimId,
    periodStart,
    periodEnd,
    workedHours,
    earnings,
    submittedAt: new Date().toISOString(),
  };
  await sessionCache.setJson(key, [...existing, report]);
  return report;
}
