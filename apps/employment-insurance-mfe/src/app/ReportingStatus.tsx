import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import { useLocale } from '@tn4consulting/shared-i18n';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { fillTemplate } from '@tn4consulting/shared-content-client';
import type { EiReportingStatus, EiReportingStatusLabel, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { HttpEmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { assetBaseUrl } from './asset-base-url';
import { loadRuntimeConfig } from '../runtime-config';
import { REPORTING_STATUS_CONTENT_KEYS, createContentClient } from './content-client';
import { usePageContents } from './use-page-contents';

const STATUS_TONE: Record<EiReportingStatusLabel, 'warning' | 'danger' | undefined> = {
  not_yet_due: undefined,
  due_soon: 'warning',
  overdue: 'danger',
};

const STATUS_CONTENT_KEY: Record<EiReportingStatusLabel, (typeof REPORTING_STATUS_CONTENT_KEYS)[number]> = {
  not_yet_due: 'employment-insurance.reporting-status.notYetDue',
  due_soon: 'employment-insurance.reporting-status.dueSoon',
  overdue: 'employment-insurance.reporting-status.overdue',
};

/**
 * Exposed as `./EiReportingStatusWidget` for dashboard to embed -- never
 * rendered by this app's own App.tsx. Fully self-configuring (fetches its
 * own runtime config, builds its own API client and content client) since
 * there's no host to supply one -- same "every remote does its own setup"
 * principle as every other converted widget in this family.
 * `reportingStatus.nextReportDue` takes a pre-formatted, locale-aware date
 * string (computed here via Intl.DateTimeFormat, not raw ISO) plus a raw
 * day count, filled into the CMS template via `fillTemplate`.
 */
export function ReportingStatus() {
  const locale = useLocale();
  const [apiClient, setApiClient] = useState<EmploymentInsuranceApiClient | null>(null);
  const [contentClient, setContentClient] = useState<ContentClient | null>(null);
  const [reportingStatus, setReportingStatus] = useState<EiReportingStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const content = usePageContents(contentClient, REPORTING_STATUS_CONTENT_KEYS, locale);

  function label(key: (typeof REPORTING_STATUS_CONTENT_KEYS)[number]): string {
    return content[key]?.title ?? key;
  }

  useEffect(() => {
    let cancelled = false;
    loadRuntimeConfig(assetBaseUrl).then((runtimeConfig) => {
      if (!cancelled) {
        setApiClient(new HttpEmploymentInsuranceApiClient(runtimeConfig.employmentInsuranceBffBaseUrl));
        setContentClient(createContentClient(runtimeConfig.strapiBaseUrl, assetBaseUrl));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!apiClient) {
      return;
    }
    const session = getStoredSession();
    if (!session) {
      return;
    }
    let cancelled = false;
    apiClient
      .getReportingStatus(session.sub)
      .then((status) => {
        if (!cancelled) {
          setReportingStatus(status);
          setLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load EI reporting status', err);
        if (!cancelled) {
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const formattedNextReportDue = reportingStatus
    ? new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(
        new Date(reportingStatus.nextReportDue),
      )
    : null;

  return (
    <section className="reporting-status">
      <h2>{label('employment-insurance.reporting-status.heading')}</h2>
      {loadError ? (
        <p role="alert">{label('employment-insurance.reporting-status.unavailable')}</p>
      ) : loaded ? (
        reportingStatus ? (
          <scds-card
            card-title={label(STATUS_CONTENT_KEY[reportingStatus.status])}
            description={fillTemplate(label('employment-insurance.reporting-status.nextReportDue'), {
              date: formattedNextReportDue ?? '',
              days: reportingStatus.daysUntilDue,
            })}
            tone={STATUS_TONE[reportingStatus.status]}
          />
        ) : (
          <p>{label('employment-insurance.reporting-status.noClaim')}</p>
        )
      ) : null}
    </section>
  );
}
