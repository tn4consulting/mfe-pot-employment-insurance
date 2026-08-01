import { EmploymentInsuranceApiClient } from './employment-insurance-api-client';
import { EiClaim, EiReport } from './models';

/** Local dev / integration tests: calls the real employment-insurance-bff over HTTP. */
export class HttpEmploymentInsuranceApiClient implements EmploymentInsuranceApiClient {
  constructor(private readonly baseUrl: string) {}

  async applyForEi(applicantSub: string): Promise<EiClaim> {
    const response = await fetch(`${this.baseUrl}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantSub }),
    });
    if (!response.ok) {
      throw new Error(`employment-insurance-bff returned ${response.status} for POST /api/applications`);
    }
    return (await response.json()) as EiClaim;
  }

  async getClaim(applicantSub: string): Promise<EiClaim | null> {
    const url = new URL(`${this.baseUrl}/api/claims`);
    url.searchParams.set('applicantSub', applicantSub);
    const response = await fetch(url);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`employment-insurance-bff returned ${response.status} for /api/claims`);
    }
    return (await response.json()) as EiClaim;
  }

  async submitReport(
    claimId: string,
    applicantSub: string,
    periodStart: string,
    periodEnd: string,
    workedHours: number,
    earnings: number,
  ): Promise<EiReport> {
    const response = await fetch(`${this.baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId, applicantSub, periodStart, periodEnd, workedHours, earnings }),
    });
    if (!response.ok) {
      throw new Error(`employment-insurance-bff returned ${response.status} for POST /api/reports`);
    }
    return (await response.json()) as EiReport;
  }
}
