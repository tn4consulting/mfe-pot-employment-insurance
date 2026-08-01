import { InjectionToken } from '@angular/core';
import { EiClaim, EiReport } from './models';

/**
 * Employment Insurance's feature libraries depend on this abstraction, not
 * a concrete HTTP implementation directly -- see CLAUDE.md's "Apps are
 * thin, libraries hold the real functionality" section.
 */
export interface EmploymentInsuranceApiClient {
  applyForEi(applicantSub: string): Promise<EiClaim>;
  getClaim(applicantSub: string): Promise<EiClaim | null>;
  submitReport(
    claimId: string,
    applicantSub: string,
    periodStart: string,
    periodEnd: string,
    workedHours: number,
    earnings: number,
  ): Promise<EiReport>;
}

export const EMPLOYMENT_INSURANCE_API_CLIENT = new InjectionToken<EmploymentInsuranceApiClient>(
  'EMPLOYMENT_INSURANCE_API_CLIENT',
);
