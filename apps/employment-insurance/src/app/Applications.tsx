// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses.
import * as React from 'react';
import { useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { fillTemplate } from '@tn4consulting/shared-content-client';
import type { Locale } from '@tn4consulting/shared-i18n';
import type { EiClaim, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { APPLICATIONS_CONTENT_KEYS } from './content-client';
import { usePageContents } from './use-page-contents';

// Rendered until the CMS batch fetch resolves -- never blank, same bar
// StaticContentClient already meets as the no-CMS fallback.
const FALLBACK: Record<(typeof APPLICATIONS_CONTENT_KEYS)[number], string> = {
  'employment-insurance.applications.heading': 'Employment Insurance — Apply',
  'employment-insurance.applications.intro': 'Apply for Employment Insurance benefits.',
  'employment-insurance.applications.button': 'Apply for EI',
  'employment-insurance.applications.confirmationDescription': 'Status: {status}, weekly benefit: ${amount}.',
  'employment-insurance.applications.error': 'EI applications are temporarily unavailable.',
  'employment-insurance.claims.cardTitle': 'Claim {id}',
};

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
    return content[key]?.title ?? FALLBACK[key];
  }

  function confirmationDescription(claim: EiClaim): string {
    return fillTemplate(label('employment-insurance.applications.confirmationDescription'), {
      status: claim.status,
      amount: claim.weeklyBenefitAmount.toFixed(2),
    });
  }

  async function apply(): Promise<void> {
    const session = getStoredSession();
    if (!session) {
      return;
    }
    setSubmitting(true);
    try {
      setConfirmation(await apiClient.applyForEi(session.sub));
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
        <>
          <p>{label('employment-insurance.applications.intro')}</p>
          <button type="button" disabled={submitting} onClick={() => void apply()}>
            {label('employment-insurance.applications.button')}
          </button>
        </>
      )}
    </section>
  );
}
