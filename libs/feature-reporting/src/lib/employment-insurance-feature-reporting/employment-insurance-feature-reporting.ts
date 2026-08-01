import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPLOYMENT_INSURANCE_API_CLIENT, EiReport } from 'employment-insurance-data-access';
import { getStoredSession } from '@tn4consulting/shared-auth';

@Component({
  selector: 'lib-employment-insurance-feature-reporting',
  imports: [CommonModule, FormsModule],
  templateUrl: './employment-insurance-feature-reporting.html',
  styleUrl: './employment-insurance-feature-reporting.css',
})
export class EmploymentInsuranceFeatureReporting implements OnInit {
  private readonly apiClient = inject(EMPLOYMENT_INSURANCE_API_CLIENT);

  protected readonly claimId = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly confirmation = signal<EiReport | null>(null);
  protected readonly reportError = signal(false);

  protected workedHours = 0;
  protected earnings = 0;

  async ngOnInit(): Promise<void> {
    const session = getStoredSession();
    if (!session) {
      return;
    }
    try {
      const claim = await this.apiClient.getClaim(session.sub);
      this.claimId.set(claim?.id ?? null);
    } catch (err) {
      console.error('Failed to load claim for reporting', err);
      this.reportError.set(true);
    }
  }

  async submit(): Promise<void> {
    const session = getStoredSession();
    const claimId = this.claimId();
    if (!session || !claimId) {
      return;
    }
    this.submitting.set(true);
    try {
      this.confirmation.set(
        await this.apiClient.submitReport(
          claimId,
          session.sub,
          '2026-07-01',
          '2026-07-14',
          this.workedHours,
          this.earnings,
        ),
      );
    } catch (err) {
      console.error('Failed to submit EI report', err);
      this.reportError.set(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
