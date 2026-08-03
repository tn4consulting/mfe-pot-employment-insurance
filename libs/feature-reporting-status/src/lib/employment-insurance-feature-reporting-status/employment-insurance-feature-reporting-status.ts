import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@tn4consulting/shared-i18n';
import { getStoredSession } from '@tn4consulting/shared-auth';
import { EMPLOYMENT_INSURANCE_API_CLIENT, EiReportingStatus, EiReportingStatusLabel } from 'employment-insurance-data-access';

const STATUS_LABEL_KEY: Record<EiReportingStatusLabel, string> = {
  not_yet_due: 'reportingStatus.notYetDue',
  due_soon: 'reportingStatus.dueSoon',
  overdue: 'reportingStatus.overdue',
};

/**
 * Self-fetches from employment-insurance-bff directly -- exposed as a
 * federated widget (see federation.config.mjs's './EiReportingStatusWidget')
 * for dashboard to embed via the shell-mediated EI_REPORTING_STATUS_WIDGET_LOADER
 * token, rather than dashboard-bff proxying this data on EI's behalf. See
 * mfe-pot-platform/CLAUDE.md's federation section for why cross-remote
 * composition is host-mediated.
 */
@Component({
  selector: 'lib-employment-insurance-feature-reporting-status',
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './employment-insurance-feature-reporting-status.html',
  styleUrl: './employment-insurance-feature-reporting-status.css',
})
export class EmploymentInsuranceFeatureReportingStatus implements OnInit {
  private readonly apiClient = inject(EMPLOYMENT_INSURANCE_API_CLIENT);
  private readonly transloco = inject(TranslocoService);

  protected readonly reportingStatus = signal<EiReportingStatus | null>(null);
  protected readonly loaded = signal(false);
  protected readonly loadError = signal(false);
  protected readonly lang = signal(this.transloco.getActiveLang());

  protected readonly statusLabelKey = computed(() => {
    const status = this.reportingStatus();
    return status ? STATUS_LABEL_KEY[status.status] : null;
  });

  protected readonly formattedNextReportDue = computed(() => {
    const status = this.reportingStatus();
    if (!status) {
      return null;
    }
    return new Intl.DateTimeFormat(this.lang() === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(
      new Date(status.nextReportDue),
    );
  });

  async ngOnInit(): Promise<void> {
    this.transloco.langChanges$.subscribe((lang) => this.lang.set(lang));

    const session = getStoredSession();
    if (!session) {
      return;
    }
    try {
      this.reportingStatus.set(await this.apiClient.getReportingStatus(session.sub));
      this.loaded.set(true);
    } catch (err) {
      console.error('Failed to load EI reporting status', err);
      this.loadError.set(true);
    }
  }
}
