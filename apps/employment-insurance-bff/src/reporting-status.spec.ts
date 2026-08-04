import { EiClaim, EiReport } from './data';
import { computeReportingStatus } from './reporting-status';

function makeClaim(appliedAt: string): EiClaim {
  return {
    id: 'claim-1',
    applicantSub: 'mock-citizen-001',
    status: 'approved',
    weeklyBenefitAmount: 638.0,
    appliedAt,
  };
}

function makeReport(periodEnd: string): EiReport {
  return {
    id: 'report-1',
    applicantSub: 'mock-citizen-001',
    claimId: 'claim-1',
    periodStart: '2026-07-01',
    periodEnd,
    workedHours: 0,
    earnings: 0,
    submittedAt: '2026-07-15T00:00:00.000Z',
  };
}

describe('computeReportingStatus', () => {
  const now = new Date('2026-07-15T00:00:00.000Z');

  it('anchors on the claim date when no reports have been submitted', () => {
    const claim = makeClaim('2026-07-01T00:00:00.000Z');
    const result = computeReportingStatus(claim, [], now);
    expect(result.nextReportDue).toBe('2026-07-15T00:00:00.000Z');
    expect(result.daysUntilDue).toBe(0);
    expect(result.status).toBe('due_soon');
  });

  it('anchors on the latest reported period end when reports exist', () => {
    const claim = makeClaim('2026-06-01T00:00:00.000Z');
    const reports = [makeReport('2026-07-01T00:00:00.000Z'), makeReport('2026-07-08T00:00:00.000Z')];
    const result = computeReportingStatus(claim, reports, now);
    // latest periodEnd is 2026-07-08 + 14 days = 2026-07-22
    expect(result.nextReportDue).toBe('2026-07-22T00:00:00.000Z');
    expect(result.daysUntilDue).toBe(7);
    expect(result.status).toBe('not_yet_due');
  });

  it('reports overdue when the due date has passed', () => {
    const claim = makeClaim('2026-06-01T00:00:00.000Z');
    const result = computeReportingStatus(claim, [makeReport('2026-06-20T00:00:00.000Z')], now);
    // 2026-06-20 + 14 days = 2026-07-04, which is before `now`
    expect(result.status).toBe('overdue');
    expect(result.daysUntilDue).toBeLessThan(0);
  });

  it('reports due_soon exactly at the 3-day boundary', () => {
    const claim = makeClaim('2026-07-04T00:00:00.000Z');
    const result = computeReportingStatus(claim, [], now);
    // 2026-07-04 + 14 days = 2026-07-18, 3 days out from `now` (2026-07-15)
    expect(result.daysUntilDue).toBe(3);
    expect(result.status).toBe('due_soon');
  });

  it('reports not_yet_due just past the 3-day boundary', () => {
    const claim = makeClaim('2026-07-05T00:00:00.000Z');
    const result = computeReportingStatus(claim, [], now);
    // 2026-07-05 + 14 days = 2026-07-19, 4 days out from `now` (2026-07-15)
    expect(result.daysUntilDue).toBe(4);
    expect(result.status).toBe('not_yet_due');
  });
});
