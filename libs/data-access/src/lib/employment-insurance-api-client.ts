import { EiClaim, EiReport, EiReportingStatus } from './models';

/**
 * Employment Insurance's feature components depend on this abstraction,
 * never on a concrete HTTP implementation directly -- see CLAUDE.md's
 * "Apps are thin, libraries hold the real functionality" section.
 *
 * No Angular `InjectionToken` here (unlike this file's pre-React-port
 * history) -- App.tsx passes the concrete client down as a plain prop,
 * not through Angular DI, and this library must stay resolvable from a
 * bundle with no Angular installed at all.
 */
export interface EmploymentInsuranceApiClient {
  applyForEi(applicantSub: string): Promise<EiClaim>;
  getClaim(applicantSub: string): Promise<EiClaim | null>;
  getReportingStatus(applicantSub: string): Promise<EiReportingStatus | null>;
  submitReport(
    claimId: string,
    applicantSub: string,
    periodStart: string,
    periodEnd: string,
    workedHours: number,
    earnings: number,
  ): Promise<EiReport>;
}
