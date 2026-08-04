import { randomUUID } from 'node:crypto';
import { sessionCache } from './config';

export type ClaimStatus = 'pending' | 'approved';

export interface EiClaim {
  id: string;
  applicantSub: string;
  status: ClaimStatus;
  weeklyBenefitAmount: number;
  appliedAt: string;
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

export async function createClaim(applicantSub: string): Promise<EiClaim> {
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
    weeklyBenefitAmount: 638.0,
    appliedAt: new Date().toISOString(),
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
