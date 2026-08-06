import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import type { EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { Claims } from './Claims';

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

describe('Claims', () => {
  afterEach(() => clearSession());

  it('shows the claim once loaded', async () => {
    storeSession(createMockSession());
    const apiClient = fakeApiClient({
      getClaim: jest
        .fn()
        .mockResolvedValue({ id: 'claim-1', status: 'approved', weeklyBenefitAmount: 450, appliedAt: '' }),
    });

    render(<Claims apiClient={apiClient} contentClient={contentClient} locale="en" />);

    const card = await screen.findByText((_, el) => el?.tagName.toLowerCase() === 'scds-card');
    expect(card.getAttribute('card-title')).toBe('Claim claim-1');
    expect(card.getAttribute('description')).toBe('Status: approved.');
  });

  it('shows "No claim on file yet." when there is none', async () => {
    storeSession(createMockSession());
    const apiClient = fakeApiClient({ getClaim: jest.fn().mockResolvedValue(null) });

    render(<Claims apiClient={apiClient} contentClient={contentClient} locale="en" />);

    expect(await screen.findByText('No claim on file yet.')).toBeInTheDocument();
  });

  it('shows an alert when loading fails', async () => {
    storeSession(createMockSession());
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const apiClient = fakeApiClient({ getClaim: jest.fn().mockRejectedValue(new Error('boom')) });

    render(<Claims apiClient={apiClient} contentClient={contentClient} locale="en" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});
