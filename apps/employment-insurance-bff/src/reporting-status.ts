import { EiClaim, EiReport } from './data';

const REPORTING_PERIOD_DAYS = 14;
const DUE_SOON_THRESHOLD_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type EiReportingStatusLabel = 'not_yet_due' | 'due_soon' | 'overdue';

export interface EiReportingStatus {
  claimId: string;
  nextReportDue: string;
  daysUntilDue: number;
  status: EiReportingStatusLabel;
}

/**
 * There's no real EI reporting-cadence rule anywhere in this PoT -- reports
 * are just a write-only log (see data.ts). This synthesizes a simple
 * biweekly cadence: the next report is due 14 days after the last reported
 * period's end, or 14 days after the claim was applied for if nothing has
 * been reported yet.
 */
export function computeReportingStatus(
  claim: EiClaim,
  reports: EiReport[],
  now: Date = new Date(),
): EiReportingStatus {
  const anchor = reports.reduce<Date>(
    (latest, report) => {
      const periodEnd = new Date(report.periodEnd);
      return periodEnd > latest ? periodEnd : latest;
    },
    new Date(claim.appliedAt),
  );

  const nextReportDue = new Date(anchor.getTime() + REPORTING_PERIOD_DAYS * MS_PER_DAY);
  const daysUntilDue = Math.ceil((nextReportDue.getTime() - now.getTime()) / MS_PER_DAY);

  const status: EiReportingStatusLabel =
    daysUntilDue < 0 ? 'overdue' : daysUntilDue <= DUE_SOON_THRESHOLD_DAYS ? 'due_soon' : 'not_yet_due';

  return {
    claimId: claim.id,
    nextReportDue: nextReportDue.toISOString(),
    daysUntilDue,
    status,
  };
}
