import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { fillTemplate } from '@tn4consulting/shared-content-client';
import type { Locale } from '@tn4consulting/shared-i18n';
import type { EiReport, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { REPORTING_CONTENT_KEYS } from './content-client';
import { usePageContents } from './use-page-contents';

export interface ReportingProps {
  apiClient: EmploymentInsuranceApiClient;
  contentClient: ContentClient;
  locale: Locale;
}

export function Reporting({ apiClient, contentClient, locale }: ReportingProps) {
  const [claimId, setClaimId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<EiReport | null>(null);
  const [reportError, setReportError] = useState(false);
  const [workedHours, setWorkedHours] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const content = usePageContents(contentClient, REPORTING_CONTENT_KEYS, locale);

  function label(key: (typeof REPORTING_CONTENT_KEYS)[number]): string {
    return content[key]?.title ?? key;
  }

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
      <h2>{label('employment-insurance.reporting.heading')}</h2>
      {confirmation ? (
        <p role="status">
          {fillTemplate(label('employment-insurance.reporting.confirmation'), {
            id: confirmation.id,
            periodStart: confirmation.periodStart,
            periodEnd: confirmation.periodEnd,
          })}
        </p>
      ) : reportError ? (
        <p role="alert">{label('employment-insurance.reporting.error')}</p>
      ) : !claimId ? (
        <p>{label('employment-insurance.reporting.noClaim')}</p>
      ) : (
        <>
          <label htmlFor="ei-worked-hours">{label('employment-insurance.reporting.hoursLabel')}</label>
          <input
            id="ei-worked-hours"
            type="number"
            min={0}
            name="workedHours"
            value={workedHours}
            onChange={(event) => setWorkedHours(event.target.valueAsNumber || 0)}
          />
          <label htmlFor="ei-earnings">{label('employment-insurance.reporting.earningsLabel')}</label>
          <input
            id="ei-earnings"
            type="number"
            min={0}
            name="earnings"
            value={earnings}
            onChange={(event) => setEarnings(event.target.valueAsNumber || 0)}
          />
          <button type="button" disabled={submitting} onClick={() => void submit()}>
            {label('employment-insurance.reporting.submitButton')}
          </button>
        </>
      )}
    </section>
  );
}
