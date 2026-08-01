import { TestBed } from '@angular/core/testing';
import {
  EMPLOYMENT_INSURANCE_API_CLIENT,
  EmploymentInsuranceApiClient,
} from 'employment-insurance-data-access';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { EmploymentInsuranceFeatureClaims } from './employment-insurance-feature-claims';

describe('EmploymentInsuranceFeatureClaims', () => {
  const apiClient: jest.Mocked<EmploymentInsuranceApiClient> = {
    applyForEi: jest.fn(),
    getClaim: jest.fn(),
    submitReport: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    storeSession(createMockSession());
    await TestBed.configureTestingModule({
      imports: [EmploymentInsuranceFeatureClaims],
      providers: [{ provide: EMPLOYMENT_INSURANCE_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  });

  afterEach(() => clearSession());

  it('shows the claim status when one is on file', async () => {
    apiClient.getClaim.mockResolvedValue({
      id: 'claim-1',
      applicantSub: 'mock-citizen-001',
      status: 'approved',
      weeklyBenefitAmount: 638,
      appliedAt: '2026-08-01T00:00:00.000Z',
    });

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureClaims);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('claim-1');
  });

  it('shows a no-claim state when there is none on file', async () => {
    apiClient.getClaim.mockResolvedValue(null);

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureClaims);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No claim on file');
  });

  it('shows an error state when the claim fails to load', async () => {
    apiClient.getClaim.mockRejectedValue(new Error('network down'));

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureClaims);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
  });
});
