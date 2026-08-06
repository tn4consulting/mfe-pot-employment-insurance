import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import type { EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { Applications } from './Applications';

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

describe('Applications', () => {
  afterEach(() => clearSession());

  it('submits an application and renders the confirmation card', async () => {
    storeSession(createMockSession());
    const apiClient = fakeApiClient({
      applyForEi: jest
        .fn()
        .mockResolvedValue({ id: 'claim-1', status: 'approved', weeklyBenefitAmount: 450, appliedAt: '' }),
    });

    render(<Applications apiClient={apiClient} contentClient={contentClient} locale="en" />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply for EI' }));

    const card = await screen.findByRole('status');
    expect(card.getAttribute('card-title')).toBe('Claim claim-1');
    expect(card.getAttribute('description')).toBe('Status: approved, weekly benefit: $450.00.');
    expect(card.getAttribute('tone')).toBe('success');
  });

  it('shows an alert when the application fails', async () => {
    storeSession(createMockSession());
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const apiClient = fakeApiClient({ applyForEi: jest.fn().mockRejectedValue(new Error('boom')) });

    render(<Applications apiClient={apiClient} contentClient={contentClient} locale="en" />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply for EI' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});
