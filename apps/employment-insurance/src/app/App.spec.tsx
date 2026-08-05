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
jest.mock('./content-client', () => ({
  INTRO_CONTENT_KEY: 'employment-insurance.intro',
  createContentClient: () => ({ getPageContent: getPageContentMock }),
}));

describe('App', () => {
  beforeEach(() => {
    getPageContentMock.mockReset().mockResolvedValue(null);
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
    expect(screen.getByRole('heading', { level: 2, name: 'Claim status' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Submit your EI report' })).toBeInTheDocument();
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
