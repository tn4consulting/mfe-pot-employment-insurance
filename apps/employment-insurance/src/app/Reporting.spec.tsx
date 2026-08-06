import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import type { EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { Reporting } from './Reporting';

const contentClient: ContentClient = {
  getPageContent: jest.fn().mockResolvedValue(null),
  getPageContents: jest.fn().mockResolvedValue({}),
};

function fakeApiClient(overrides: Partial<EmploymentInsuranceApiClient> = {}): EmploymentInsuranceApiClient {
  return {
    applyForEi: jest.fn(),
    getClaim: jest.fn(),
    getReportingStatus: jest.fn(),
    submitReport: jest.fn(),
    ...overrides,
  };
}

describe('Reporting', () => {
  afterEach(() => clearSession());

  it('prompts to apply first when there is no claim', async () => {
    storeSession(createMockSession());
    const apiClient = fakeApiClient({ getClaim: jest.fn().mockResolvedValue(null) });

    render(<Reporting apiClient={apiClient} contentClient={contentClient} locale="en" />);

    expect(await screen.findByText(/You need an active EI claim/)).toBeInTheDocument();
  });

  it('submits a report once a claim exists', async () => {
    storeSession(createMockSession());
    const apiClient = fakeApiClient({
      getClaim: jest
        .fn()
        .mockResolvedValue({ id: 'claim-1', status: 'approved', weeklyBenefitAmount: 450, appliedAt: '' }),
      submitReport: jest.fn().mockResolvedValue({
        id: 'report-1',
        applicantSub: 'mock-citizen-001',
        claimId: 'claim-1',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-14',
        workedHours: 10,
        earnings: 200,
        submittedAt: '',
      }),
    });

    render(<Reporting apiClient={apiClient} contentClient={contentClient} locale="en" />);
    await screen.findByLabelText('Hours worked this period');
    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Report report-1 submitted for 2026-07-01 to 2026-07-14.');
    expect(apiClient.submitReport).toHaveBeenCalledWith('claim-1', 'mock-citizen-001', '2026-07-01', '2026-07-14', 0, 0);
  });
});
