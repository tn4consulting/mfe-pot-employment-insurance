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

const claims: EiClaim[] = [];
const reports: EiReport[] = [];

export function createClaim(applicantSub: string): EiClaim {
  const claim: EiClaim = {
    id: `claim-${claims.length + 1}`,
    applicantSub,
    status: 'approved',
    weeklyBenefitAmount: 638.0,
    appliedAt: new Date().toISOString(),
  };
  claims.push(claim);
  return claim;
}

export function getClaim(applicantSub: string): EiClaim | undefined {
  return [...claims].reverse().find((claim) => claim.applicantSub === applicantSub);
}

export function createReport(
  claimId: string,
  applicantSub: string,
  periodStart: string,
  periodEnd: string,
  workedHours: number,
  earnings: number,
): EiReport {
  const report: EiReport = {
    id: `report-${reports.length + 1}`,
    applicantSub,
    claimId,
    periodStart,
    periodEnd,
    workedHours,
    earnings,
    submittedAt: new Date().toISOString(),
  };
  reports.push(report);
  return report;
}
