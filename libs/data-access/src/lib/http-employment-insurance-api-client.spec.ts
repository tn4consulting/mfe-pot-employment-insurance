import { clearSession, storeSession } from '@tn4consulting/shared-auth/core';
import { HttpEmploymentInsuranceApiClient } from './http-employment-insurance-api-client';

describe('HttpEmploymentInsuranceApiClient', () => {
  const originalFetch = global.fetch;
  const client = new HttpEmploymentInsuranceApiClient('http://localhost:3002');

  afterEach(() => {
    global.fetch = originalFetch;
    clearSession();
  });

  it('attaches the mock-idp access token as a Bearer header when signed in', async () => {
    storeSession({
      sub: 'citizen-abc123',
      name: 'Alex Chen',
      claims: [],
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      accessToken: 'real-looking.jwt.value',
    });
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: 'claim-1', status: 'approved' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await client.applyForEi('citizen-abc123');

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer real-looking.jwt.value');
  });

  it('omits the Authorization header when not signed in', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: 'claim-1', status: 'approved' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await client.applyForEi('citizen-abc123');

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('applies for EI', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'claim-1', status: 'approved' }),
    }) as unknown as typeof fetch;

    const claim = await client.applyForEi('mock-citizen-001');
    expect(claim.id).toBe('claim-1');
  });

  it('returns null when there is no claim on file', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    const claim = await client.getClaim('mock-citizen-001');
    expect(claim).toBeNull();
  });

  it('throws for other non-2xx claim responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(client.getClaim('mock-citizen-001')).rejects.toThrow('500');
  });

  it('returns the claim when found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'claim-1', status: 'approved' }),
    }) as unknown as typeof fetch;
    const claim = await client.getClaim('mock-citizen-001');
    expect(claim?.id).toBe('claim-1');
  });

  it('returns null when there is no claim on file for reporting status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    const status = await client.getReportingStatus('mock-citizen-001');
    expect(status).toBeNull();
  });

  it('throws for other non-2xx reporting-status responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(client.getReportingStatus('mock-citizen-001')).rejects.toThrow('500');
  });

  it('returns the reporting status when found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        claimId: 'claim-1',
        nextReportDue: '2026-07-22T00:00:00.000Z',
        daysUntilDue: 7,
        status: 'not_yet_due',
      }),
    }) as unknown as typeof fetch;
    const status = await client.getReportingStatus('mock-citizen-001');
    expect(status).toMatchObject({ claimId: 'claim-1', status: 'not_yet_due' });
  });

  it('submits a biweekly report', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'report-1' }),
    }) as unknown as typeof fetch;

    const report = await client.submitReport('claim-1', 'mock-citizen-001', '2026-07-01', '2026-07-14', 0, 0);
    expect(report.id).toBe('report-1');
  });
});
