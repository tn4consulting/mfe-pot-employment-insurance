import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { ReportingStatus } from './ReportingStatus';

jest.mock('./asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4204/' }));
jest.mock('../runtime-config', () => ({
  loadRuntimeConfig: jest
    .fn()
    .mockResolvedValue({ employmentInsuranceBffBaseUrl: 'http://localhost:3002', strapiBaseUrl: undefined }),
}));

// No strapiBaseUrl configured above, so content comes from the real
// StaticContentClient's fetched fallback (content-client.ts).
const FALLBACK_EN = {
  'employment-insurance.reporting-status.heading': { title: 'EI Reporting Status', body: '' },
  'employment-insurance.reporting-status.unavailable': { title: 'EI reporting status is temporarily unavailable.', body: '' },
  'employment-insurance.reporting-status.noClaim': { title: 'No active EI claim on file.', body: '' },
  'employment-insurance.reporting-status.notYetDue': { title: 'Not yet due', body: '' },
  'employment-insurance.reporting-status.dueSoon': { title: 'Due soon', body: '' },
  'employment-insurance.reporting-status.overdue': { title: 'Overdue', body: '' },
  'employment-insurance.reporting-status.nextReportDue': { title: 'Next report due {date} ({days} days)', body: '' },
};

describe('ReportingStatus', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      if (url.toString().includes('content-fallback')) {
        return Promise.resolve({ json: () => Promise.resolve(FALLBACK_EN) });
      }
      if (url.toString().includes('/api/reporting-status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              claimId: 'claim-1',
              nextReportDue: '2026-07-22T00:00:00.000Z',
              daysUntilDue: 7,
              status: 'not_yet_due',
            }),
        });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('renders nothing meaningful when there is no session', async () => {
    render(<ReportingStatus />);
    expect(await screen.findByRole('heading', { name: 'EI Reporting Status' })).toBeInTheDocument();
    expect(screen.queryByText('Not yet due')).not.toBeInTheDocument();
  });

  it('interpolates the next-report-due date and day count once loaded', async () => {
    storeSession(createMockSession());

    render(<ReportingStatus />);

    await waitFor(() => {
      const card = screen.getByText((_, el) => el?.tagName.toLowerCase() === 'scds-card');
      expect(card.getAttribute('card-title')).toBe('Not yet due');
      expect(card.getAttribute('description')).toBe('Next report due July 22, 2026 (7 days)');
      expect(card.getAttribute('tone')).toBeNull();
    });
  });

  it('shows a no-claim message when there is a session but no active claim', async () => {
    storeSession(createMockSession());
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.toString().includes('content-fallback')) {
        return Promise.resolve({ json: () => Promise.resolve(FALLBACK_EN) });
      }
      if (url.toString().includes('/api/reporting-status')) {
        // HttpEmploymentInsuranceApiClient.getReportingStatus maps a 404
        // specifically to `null` (a legitimate "no claim yet" state, not
        // an error) -- this is what actually drives the noClaim branch.
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });

    render(<ReportingStatus />);

    expect(await screen.findByText('No active EI claim on file.')).toBeInTheDocument();
  });
});
