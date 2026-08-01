import { TestBed } from '@angular/core/testing';
import {
  EMPLOYMENT_INSURANCE_API_CLIENT,
  EmploymentInsuranceApiClient,
} from 'employment-insurance-data-access';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { EmploymentInsuranceFeatureApplications } from './employment-insurance-feature-applications';

describe('EmploymentInsuranceFeatureApplications', () => {
  const apiClient: jest.Mocked<EmploymentInsuranceApiClient> = {
    applyForEi: jest.fn(),
    getClaim: jest.fn(),
    submitReport: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    storeSession(createMockSession());
    await TestBed.configureTestingModule({
      imports: [EmploymentInsuranceFeatureApplications],
      providers: [{ provide: EMPLOYMENT_INSURANCE_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  });

  afterEach(() => clearSession());

  it('submits an application and shows the resulting claim', async () => {
    apiClient.applyForEi.mockResolvedValue({
      id: 'claim-1',
      applicantSub: 'mock-citizen-001',
      status: 'approved',
      weeklyBenefitAmount: 638,
      appliedAt: '2026-08-01T00:00:00.000Z',
    });

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureApplications);
    fixture.detectChanges();

    await fixture.componentInstance.apply();
    fixture.detectChanges();

    expect(apiClient.applyForEi).toHaveBeenCalledWith('mock-citizen-001');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain('claim-1');
  });

  it('shows an error state when the application fails', async () => {
    apiClient.applyForEi.mockRejectedValue(new Error('network down'));

    const fixture = TestBed.createComponent(EmploymentInsuranceFeatureApplications);
    fixture.detectChanges();

    await fixture.componentInstance.apply();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
  });
});
