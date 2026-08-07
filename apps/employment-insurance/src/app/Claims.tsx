import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { fillTemplate } from '@tn4consulting/shared-content-client';
import type { Locale } from '@tn4consulting/shared-i18n';
import type { EiClaim, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { CLAIMS_CONTENT_KEYS } from './content-client';
import { usePageContents } from './use-page-contents';

export interface ClaimsProps {
  apiClient: EmploymentInsuranceApiClient;
  contentClient: ContentClient;
  locale: Locale;
}

function claimTone(claim: EiClaim): 'success' | undefined {
  return claim.status === 'approved' ? 'success' : undefined;
}

export function Claims({ apiClient, contentClient, locale }: ClaimsProps) {
  const [claim, setClaim] = useState<EiClaim | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const content = usePageContents(contentClient, CLAIMS_CONTENT_KEYS, locale);

  function label(key: (typeof CLAIMS_CONTENT_KEYS)[number]): string {
    return content[key]?.title ?? key;
  }

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    apiClient
      .getClaim(session.sub)
      .then((result) => {
        if (!cancelled) {
          setClaim(result);
        }
      })
      .catch((err) => {
        console.error('Failed to load claim status', err);
        if (!cancelled) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  return (
    <section className="ei-claims">
      <h2>{label('employment-insurance.claims.heading')}</h2>
      {loadError ? (
        <p role="alert">{label('employment-insurance.claims.error')}</p>
      ) : loaded ? (
        claim ? (
          <scds-card
            card-title={fillTemplate(label('employment-insurance.claims.cardTitle'), { id: claim.id })}
            description={fillTemplate(label('employment-insurance.claims.status'), { status: claim.status })}
            tone={claimTone(claim)}
          />
        ) : (
          <p>{label('employment-insurance.claims.empty')}</p>
        )
      ) : null}
    </section>
  );
}
