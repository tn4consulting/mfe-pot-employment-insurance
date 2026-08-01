import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EmploymentInsuranceFeatureApplications } from 'employment-insurance-feature-applications';
import { EmploymentInsuranceFeatureClaims } from 'employment-insurance-feature-claims';
import { EmploymentInsuranceFeatureReporting } from 'employment-insurance-feature-reporting';
import { TranslocoPipe } from '@tn4consulting/shared-i18n';
import { CLAIM_EI, getStoredSession, hasClaim, onSessionChange } from '@tn4consulting/shared-auth';

@Component({
  imports: [
    EmploymentInsuranceFeatureApplications,
    EmploymentInsuranceFeatureClaims,
    EmploymentInsuranceFeatureReporting,
    RouterModule,
    TranslocoPipe,
  ],
  selector: 'msca-ei-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'employment-insurance';
  // Defense in depth: this app validates its own claim independently,
  // never assuming "the shell let me navigate here, so I'm authorized" --
  // see CLAUDE.md's "Security: defense in depth" section.
  protected readonly hasAccess = signal(hasClaim(getStoredSession(), CLAIM_EI));

  constructor() {
    const unsubscribe = onSessionChange((session) =>
      this.hasAccess.set(hasClaim(session, CLAIM_EI)),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }
}
