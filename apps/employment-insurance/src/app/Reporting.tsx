import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { EiReport, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';

export interface ReportingProps {
  apiClient: EmploymentInsuranceApiClient;
}

export function Reporting({ apiClient }: ReportingProps) {
  const [claimId, setClaimId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<EiReport | null>(null);
  const [reportError, setReportError] = useState(false);
  const [workedHours, setWorkedHours] = useState(0);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      return;
    }
    let cancelled = false;
    apiClient
      .getClaim(session.sub)
      .then((claim) => {
        if (!cancelled) {
          setClaimId(claim?.id ?? null);
        }
      })
      .catch((err) => {
        console.error('Failed to load claim for reporting', err);
        if (!cancelled) {
          setReportError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  async function submit(): Promise<void> {
    const session = getStoredSession();
    if (!session || !claimId) {
      return;
    }
    setSubmitting(true);
    try {
      // Hardcoded period dates -- not derived from any current-period
      // logic, same pre-existing stub as the Angular version this
      // replaces (see this repo's CLAUDE.md).
      setConfirmation(
        await apiClient.submitReport(claimId, session.sub, '2026-07-01', '2026-07-14', workedHours, earnings),
      );
    } catch (err) {
      console.error('Failed to submit EI report', err);
      setReportError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ei-reporting">
      <h2>Submit your EI report</h2>
      {confirmation ? (
        <p role="status">
          Report {confirmation.id} submitted for {confirmation.periodStart} to {confirmation.periodEnd}.
        </p>
      ) : reportError ? (
        <p role="alert">EI reporting is temporarily unavailable.</p>
      ) : !claimId ? (
        <p>You need an active EI claim before you can submit a report.</p>
      ) : (
        <>
          <label htmlFor="ei-worked-hours">Hours worked this period</label>
          <input
            id="ei-worked-hours"
            type="number"
            min={0}
            name="workedHours"
            value={workedHours}
            onChange={(event) => setWorkedHours(event.target.valueAsNumber || 0)}
          />
          <label htmlFor="ei-earnings">Earnings this period ($)</label>
          <input
            id="ei-earnings"
            type="number"
            min={0}
            name="earnings"
            value={earnings}
            onChange={(event) => setEarnings(event.target.valueAsNumber || 0)}
          />
          <button type="button" disabled={submitting} onClick={() => void submit()}>
            Submit report
          </button>
        </>
      )}
    </section>
  );
}
