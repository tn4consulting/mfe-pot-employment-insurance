import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { App } from './App';

jest.mock('./asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4204/' }));
jest.mock('./register-scds', () => ({}));

jest.mock('../runtime-config', () => ({
  loadRuntimeConfig: jest
    .fn()
    .mockResolvedValue({ employmentInsuranceBffBaseUrl: 'http://localhost:3002', strapiBaseUrl: undefined }),
}));

const getPageContentMock = jest.fn();
const getPageContentsMock = jest.fn();
jest.mock('./content-client', () => ({
  INTRO_CONTENT_KEY: 'employment-insurance.intro',
  CLAIMS_CONTENT_KEYS: [
    'employment-insurance.claims.heading',
    'employment-insurance.claims.error',
    'employment-insurance.claims.cardTitle',
    'employment-insurance.claims.status',
    'employment-insurance.claims.empty',
  ],
  APPLICATIONS_CONTENT_KEYS: [
    'employment-insurance.applications.heading',
    'employment-insurance.applications.intro',
    'employment-insurance.applications.button',
    'employment-insurance.applications.confirmationDescription',
    'employment-insurance.applications.error',
    'employment-insurance.claims.cardTitle',
  ],
  REPORTING_CONTENT_KEYS: [
    'employment-insurance.reporting.heading',
    'employment-insurance.reporting.error',
    'employment-insurance.reporting.noClaim',
    'employment-insurance.reporting.hoursLabel',
    'employment-insurance.reporting.earningsLabel',
    'employment-insurance.reporting.submitButton',
    'employment-insurance.reporting.confirmation',
  ],
  REPORTING_STATUS_CONTENT_KEYS: [
    'employment-insurance.reporting-status.heading',
    'employment-insurance.reporting-status.unavailable',
    'employment-insurance.reporting-status.noClaim',
    'employment-insurance.reporting-status.notYetDue',
    'employment-insurance.reporting-status.dueSoon',
    'employment-insurance.reporting-status.overdue',
    'employment-insurance.reporting-status.nextReportDue',
  ],
  // EiApplicationForm's own content keys -- App.spec.tsx only asserts on
  // the surrounding page headings, never drills into wizard-step content,
  // so an empty list (falling back to raw content keys as label text) is
  // enough here. See EiApplicationForm.spec.tsx for real wizard coverage.
  APPLICATION_FORM_CONTENT_KEYS: [],
  createContentClient: () => ({ getPageContent: getPageContentMock, getPageContents: getPageContentsMock }),
}));

describe('App', () => {
  beforeEach(() => {
    getPageContentMock.mockReset().mockResolvedValue(null);
    getPageContentsMock.mockReset().mockResolvedValue({
      'employment-insurance.claims.heading': { title: 'Claim status', body: '' },
      'employment-insurance.claims.error': { title: 'Claim status is temporarily unavailable.', body: '' },
      'employment-insurance.claims.cardTitle': { title: 'Claim {id}', body: '' },
      'employment-insurance.claims.status': { title: 'Status: {status}.', body: '' },
      'employment-insurance.claims.empty': { title: 'No claim on file yet.', body: '' },
      'employment-insurance.applications.heading': { title: 'Employment Insurance — Apply', body: '' },
      'employment-insurance.applications.intro': { title: 'Apply for Employment Insurance benefits.', body: '' },
      'employment-insurance.applications.button': { title: 'Apply for EI', body: '' },
      'employment-insurance.applications.confirmationDescription': {
        title: 'Status: {status}, weekly benefit: ${amount}.',
        body: '',
      },
      'employment-insurance.applications.error': { title: 'EI applications are temporarily unavailable.', body: '' },
      'employment-insurance.reporting.heading': { title: 'Submit your EI report', body: '' },
      'employment-insurance.reporting.error': { title: 'EI reporting is temporarily unavailable.', body: '' },
      'employment-insurance.reporting.noClaim': {
        title: 'You need an active EI claim before you can submit a report.',
        body: '',
      },
      'employment-insurance.reporting.hoursLabel': { title: 'Hours worked this period', body: '' },
      'employment-insurance.reporting.earningsLabel': { title: 'Earnings this period ($)', body: '' },
      'employment-insurance.reporting.submitButton': { title: 'Submit report', body: '' },
      'employment-insurance.reporting.confirmation': {
        title: 'Report {id} submitted for {periodStart} to {periodEnd}.',
        body: '',
      },
      'employment-insurance.reporting-status.heading': { title: 'EI Reporting Status', body: '' },
      'employment-insurance.reporting-status.unavailable': {
        title: 'EI reporting status is temporarily unavailable.',
        body: '',
      },
      'employment-insurance.reporting-status.noClaim': { title: 'You have no active EI claim.', body: '' },
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
  });

  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('renders its feature components when the claim is present', async () => {
    storeSession(createMockSession());
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Employment Insurance — Apply' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Claim status' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Submit your EI report' })).toBeInTheDocument();
  });

  it('renders intro content fetched via ContentClient', async () => {
    storeSession(createMockSession());
    getPageContentMock.mockResolvedValue({
      key: 'employment-insurance.intro',
      title: 'Employment Insurance',
      body: 'Apply for Employment Insurance benefits, check your claim status, and submit your reports.',
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Employment Insurance' })).toBeInTheDocument();
  });

  it('blocks its own content when there is no active session, independent of the shell', async () => {
    clearSession();
    render(<App />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('auth.signInRequired');
    expect(screen.queryByText('Employment Insurance — Apply')).not.toBeInTheDocument();
  });
});
