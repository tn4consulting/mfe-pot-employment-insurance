import { TestBed } from '@angular/core/testing';
import {
  EMPLOYMENT_INSURANCE_API_CLIENT,
  EmploymentInsuranceApiClient,
} from 'employment-insurance-data-access';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { EmploymentInsuranceFeatureReportingStatus } from './employment-insurance-feature-reporting-status';

const REPORTING_STATUS_LANGS = {
  en: {
    reportingStatus: {
      heading: 'EI Reporting Status',
      notYetDue: 'Not yet due',
      dueSoon: 'Due soon',
      overdue: 'Overdue',
      nextReportDue: 'Next report due {{date}} ({{days}} days)',
      noClaim: 'No active EI claim on file.',
      unavailable: 'EI reporting status is temporarily unavailable.',
    },
  },
  fr: {
    reportingStatus: {
      heading: "État de la déclaration d'assurance-emploi",
      notYetDue: 'Pas encore requise',
      dueSoon: 'Bientôt requise',
      overdue: 'En retard',
      nextReportDue: 'Prochaine déclaration due le {{date}} ({{days}} jours)',
      noClaim: "Aucune demande d'assurance-emploi active au dossier.",
      unavailable: "L'état de la déclaration d'assurance-emploi est temporairement indisponible.",
    },
  },
};

describe('EmploymentInsuranceFeatureReportingStatus', () => {
  const apiClient: jest.Mocked<EmploymentInsuranceApiClient> = {
    applyForEi: jest.fn(),
    getClaim: jest.fn(),
    getReportingStatus: jest.fn(),
    submitReport: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    storeSession(createMockSession());
    await TestBed.configureTestingModule({
      imports: [
        EmploymentInsuranceFeatureReportingStatus,
        TranslocoTestingModule.forRoot({
          langs: REPORTING_STATUS_LANGS,
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [{ provide: EMPLOYMENT_INSURANCE_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  });

  afterEach(() => clearSession());

  it('shows a no-claim message when there is nothing on file', async () => {
    apiClient.getReportingStatus.mockResolvedValue(null);

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureReportingStatus);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No active EI claim on file');
  });

  it('renders the real reporting status once loaded', async () => {
    apiClient.getReportingStatus.mockResolvedValue({
      claimId: 'claim-1',
      nextReportDue: '2026-07-22T00:00:00.000Z',
      daysUntilDue: 7,
      status: 'not_yet_due',
    });

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureReportingStatus);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Not yet due');
    expect(text).toContain('7');
  });

  it('shows an error state when the upstream call fails', async () => {
    apiClient.getReportingStatus.mockRejectedValue(new Error('connection refused'));

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureReportingStatus);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain(
      'temporarily unavailable',
    );
  });
});
