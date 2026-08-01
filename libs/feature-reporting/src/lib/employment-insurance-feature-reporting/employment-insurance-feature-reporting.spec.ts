import { TestBed } from '@angular/core/testing';
import {
  EMPLOYMENT_INSURANCE_API_CLIENT,
  EmploymentInsuranceApiClient,
} from 'employment-insurance-data-access';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { EmploymentInsuranceFeatureReporting } from './employment-insurance-feature-reporting';

describe('EmploymentInsuranceFeatureReporting', () => {
  const apiClient: jest.Mocked<EmploymentInsuranceApiClient> = {
    applyForEi: jest.fn(),
    getClaim: jest.fn(),
    submitReport: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    storeSession(createMockSession());
    await TestBed.configureTestingModule({
      imports: [EmploymentInsuranceFeatureReporting],
      providers: [{ provide: EMPLOYMENT_INSURANCE_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  });

  afterEach(() => clearSession());

  it('prompts to apply first when there is no claim on file', async () => {
    apiClient.getClaim.mockResolvedValue(null);

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureReporting);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('active EI claim');
  });

  it('submits a report once a claim exists', async () => {
    apiClient.getClaim.mockResolvedValue({
      id: 'claim-1',
      applicantSub: 'mock-citizen-001',
      status: 'approved',
      weeklyBenefitAmount: 638,
      appliedAt: '2026-08-01T00:00:00.000Z',
    });
    apiClient.submitReport.mockResolvedValue({
      id: 'report-1',
      applicantSub: 'mock-citizen-001',
      claimId: 'claim-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-14',
      workedHours: 0,
      earnings: 0,
      submittedAt: '2026-08-01T00:00:00.000Z',
    });

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureReporting);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(apiClient.submitReport).toHaveBeenCalledWith(
      'claim-1',
      'mock-citizen-001',
      '2026-07-01',
      '2026-07-14',
      0,
      0,
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain(
      'report-1',
    );
  });
});
