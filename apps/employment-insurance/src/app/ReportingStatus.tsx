import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import { useLocale, useTranslations } from '@tn4consulting/shared-i18n';
import type { EiReportingStatus, EiReportingStatusLabel, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { HttpEmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { assetBaseUrl } from './asset-base-url';
import { loadRuntimeConfig } from '../runtime-config';

const STATUS_TONE: Record<EiReportingStatusLabel, 'warning' | 'danger' | undefined> = {
  not_yet_due: undefined,
  due_soon: 'warning',
  overdue: 'danger',
};

const STATUS_LABEL_KEY: Record<EiReportingStatusLabel, string> = {
  not_yet_due: 'reportingStatus.notYetDue',
  due_soon: 'reportingStatus.dueSoon',
  overdue: 'reportingStatus.overdue',
};

/**
 * Exposed as `./EiReportingStatusWidget` for dashboard to embed -- never
 * rendered by this app's own App.tsx. Fully self-configuring (fetches its
 * own runtime config, builds its own API client) since there's no host to
 * supply one -- same "every remote does its own setup" principle as
 * every other converted widget in this family. The one real Transloco
 * interpolation site in the whole family: `reportingStatus.nextReportDue`
 * takes a pre-formatted, locale-aware date string (computed here via
 * Intl.DateTimeFormat, not raw ISO) plus a raw day count.
 */
export function ReportingStatus() {
  const locale = useLocale();
  const { t } = useTranslations(assetBaseUrl, locale);
  const [apiClient, setApiClient] = useState<EmploymentInsuranceApiClient | null>(null);
  const [reportingStatus, setReportingStatus] = useState<EiReportingStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadRuntimeConfig(assetBaseUrl).then((runtimeConfig) => {
      if (!cancelled) {
        setApiClient(new HttpEmploymentInsuranceApiClient(runtimeConfig.employmentInsuranceBffBaseUrl));
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
      <h2>{t('reportingStatus.heading')}</h2>
      {loadError ? (
        <p role="alert">{t('reportingStatus.unavailable')}</p>
      ) : loaded ? (
        reportingStatus ? (
          <scds-card
            card-title={t(STATUS_LABEL_KEY[reportingStatus.status])}
            description={t('reportingStatus.nextReportDue', {
              date: formattedNextReportDue ?? '',
              days: reportingStatus.daysUntilDue,
            })}
            tone={STATUS_TONE[reportingStatus.status]}
          />
        ) : (
          <p>{t('reportingStatus.noClaim')}</p>
        )
      ) : null}
    </section>
  );
}
