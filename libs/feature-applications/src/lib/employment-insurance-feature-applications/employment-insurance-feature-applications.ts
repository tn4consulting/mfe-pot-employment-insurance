import { Component, inject, signal } from '@angular/core';
import { EMPLOYMENT_INSURANCE_API_CLIENT, EiClaim } from 'employment-insurance-data-access';
import { getStoredSession } from '@tn4consulting/shared-auth';
import { ScdsCard, ScdsCardTone } from '@tn4consulting/shared-ui-scds';

@Component({
  selector: 'lib-employment-insurance-feature-applications',
  imports: [ScdsCard],
  templateUrl: './employment-insurance-feature-applications.html',
  styleUrl: './employment-insurance-feature-applications.css',
})
export class EmploymentInsuranceFeatureApplications {
  private readonly apiClient = inject(EMPLOYMENT_INSURANCE_API_CLIENT);

  protected readonly submitting = signal(false);
  protected readonly confirmation = signal<EiClaim | null>(null);
  protected readonly submitError = signal(false);

  protected confirmationTone(claim: EiClaim): ScdsCardTone | undefined {
    return claim.status === 'approved' ? 'success' : undefined;
  }

  protected confirmationDescription(claim: EiClaim): string {
    return `Status: ${claim.status}, weekly benefit: $${claim.weeklyBenefitAmount.toFixed(2)}.`;
  }

  async apply(): Promise<void> {
    const session = getStoredSession();
    if (!session) {
      return;
    }
    this.submitting.set(true);
    try {
      this.confirmation.set(await this.apiClient.applyForEi(session.sub));
    } catch (err) {
      console.error('Failed to submit EI application', err);
      this.submitError.set(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
