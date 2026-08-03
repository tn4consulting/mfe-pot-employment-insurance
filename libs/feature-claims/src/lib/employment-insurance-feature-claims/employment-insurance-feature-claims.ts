import { Component, OnInit, inject, signal } from '@angular/core';
import { EMPLOYMENT_INSURANCE_API_CLIENT, EiClaim } from 'employment-insurance-data-access';
import { getStoredSession } from '@tn4consulting/shared-auth';
import { ScdsCard, ScdsCardTone } from '@tn4consulting/shared-ui-scds';

@Component({
  selector: 'lib-employment-insurance-feature-claims',
  imports: [ScdsCard],
  templateUrl: './employment-insurance-feature-claims.html',
  styleUrl: './employment-insurance-feature-claims.css',
})
export class EmploymentInsuranceFeatureClaims implements OnInit {
  private readonly apiClient = inject(EMPLOYMENT_INSURANCE_API_CLIENT);

  protected readonly claim = signal<EiClaim | null>(null);
  protected readonly loadError = signal(false);
  protected readonly loaded = signal(false);

  protected claimTone(claim: EiClaim): ScdsCardTone | undefined {
    return claim.status === 'approved' ? 'success' : undefined;
  }

  async ngOnInit(): Promise<void> {
    const session = getStoredSession();
    if (!session) {
      this.loaded.set(true);
      return;
    }
    try {
      this.claim.set(await this.apiClient.getClaim(session.sub));
    } catch (err) {
      console.error('Failed to load claim status', err);
      this.loadError.set(true);
    } finally {
      this.loaded.set(true);
    }
  }
}
