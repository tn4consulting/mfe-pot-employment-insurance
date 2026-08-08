// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses.
import * as React from 'react';
import { useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { fillTemplate } from '@tn4consulting/shared-content-client';
import type { Locale } from '@tn4consulting/shared-i18n';
import type { EiApplicationInput, EiClaim, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { APPLICATIONS_CONTENT_KEYS } from './content-client';
import { EiApplicationForm } from './EiApplicationForm';
import { usePageContents } from './use-page-contents';

export interface ApplicationsProps {
  apiClient: EmploymentInsuranceApiClient;
  contentClient: ContentClient;
  locale: Locale;
}

function confirmationTone(claim: EiClaim): 'success' | undefined {
  return claim.status === 'approved' ? 'success' : undefined;
}

export function Applications({ apiClient, contentClient, locale }: ApplicationsProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<EiClaim | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const content = usePageContents(contentClient, APPLICATIONS_CONTENT_KEYS, locale);

  function label(key: (typeof APPLICATIONS_CONTENT_KEYS)[number]): string {
    return content[key]?.title ?? key;
  }

  function confirmationDescription(claim: EiClaim): string {
    return fillTemplate(label('employment-insurance.applications.confirmationDescription'), {
      status: claim.status,
      amount: claim.weeklyBenefitAmount.toFixed(2),
    });
  }

  async function apply(application: EiApplicationInput): Promise<void> {
    const session = getStoredSession();
    if (!session) {
      return;
    }
    setSubmitting(true);
    try {
      setConfirmation(await apiClient.applyForEi(session.sub, application));
    } catch (err) {
      console.error('Failed to submit EI application', err);
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ei-applications">
      <h1>{label('employment-insurance.applications.heading')}</h1>
      {confirmation ? (
        <scds-card
          role="status"
          card-title={fillTemplate(label('employment-insurance.claims.cardTitle'), { id: confirmation.id })}
          description={confirmationDescription(confirmation)}
          tone={confirmationTone(confirmation)}
        />
      ) : submitError ? (
        <p role="alert">{label('employment-insurance.applications.error')}</p>
      ) : (
        <EiApplicationForm contentClient={contentClient} locale={locale} submitting={submitting} onSubmit={(application) => void apply(application)} />
      )}
    </section>
  );
}
