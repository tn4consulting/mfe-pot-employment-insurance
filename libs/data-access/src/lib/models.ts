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
