import { HttpEmploymentInsuranceApiClient } from './http-employment-insurance-api-client';

describe('HttpEmploymentInsuranceApiClient', () => {
  const originalFetch = global.fetch;
  const client = new HttpEmploymentInsuranceApiClient('http://localhost:3002');

  afterEach(() => {
    global.fetch = originalFetch;
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

  it('submits a biweekly report', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'report-1' }),
    }) as unknown as typeof fetch;

    const report = await client.submitReport('claim-1', 'mock-citizen-001', '2026-07-01', '2026-07-14', 0, 0);
    expect(report.id).toBe('report-1');
  });
});
