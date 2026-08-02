import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EmploymentInsuranceFeatureApplications } from 'employment-insurance-feature-applications';
import { EmploymentInsuranceFeatureClaims } from 'employment-insurance-feature-claims';
import { EmploymentInsuranceFeatureReporting } from 'employment-insurance-feature-reporting';
import { PageContent } from '@tn4consulting/shared-content-client';
import { TranslocoPipe, TranslocoService } from '@tn4consulting/shared-i18n';
import { CLAIM_EI, getStoredSession, hasClaim, onSessionChange } from '@tn4consulting/shared-auth';
import { CONTENT_CLIENT, INTRO_CONTENT_KEY } from './content-client.token';

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
export class App implements OnInit {
  protected title = 'employment-insurance';
  // Defense in depth: this app validates its own claim independently,
  // never assuming "the shell let me navigate here, so I'm authorized" --
  // see CLAUDE.md's "Security: defense in depth" section.
  protected readonly hasAccess = signal(hasClaim(getStoredSession(), CLAIM_EI));
  protected readonly intro = signal<PageContent | null>(null);
  protected readonly introLoadError = signal(false);

  private readonly contentClient = inject(CONTENT_CLIENT);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    const unsubscribe = onSessionChange((session) =>
      this.hasAccess.set(hasClaim(session, CLAIM_EI)),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  ngOnInit(): void {
    // CMS content (unlike Transloco chrome text) isn't reactive by
    // default, so this app explicitly re-fetches whenever the
    // cross-remote active locale changes -- same pattern as dashboard's
    // app.ts.
    this.loadIntro(this.transloco.getActiveLang());
    this.transloco.langChanges$.subscribe((lang) => this.loadIntro(lang));
  }

  private async loadIntro(lang: string): Promise<void> {
    try {
      this.intro.set(
        await this.contentClient.getPageContent(INTRO_CONTENT_KEY, lang === 'fr' ? 'fr' : 'en'),
      );
      this.introLoadError.set(false);
    } catch (err) {
      console.error('Failed to load employment-insurance intro content', err);
      this.introLoadError.set(true);
    }
  }
}
