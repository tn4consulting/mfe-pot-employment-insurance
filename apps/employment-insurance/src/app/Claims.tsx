import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { EiClaim, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';

export interface ClaimsProps {
  apiClient: EmploymentInsuranceApiClient;
}

function claimTone(claim: EiClaim): 'success' | undefined {
  return claim.status === 'approved' ? 'success' : undefined;
}

export function Claims({ apiClient }: ClaimsProps) {
  const [claim, setClaim] = useState<EiClaim | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
      <h2>Claim status</h2>
      {loadError ? (
        <p role="alert">Claim status is temporarily unavailable.</p>
      ) : loaded ? (
        claim ? (
          <scds-card card-title={`Claim ${claim.id}`} description={`Status: ${claim.status}.`} tone={claimTone(claim)} />
        ) : (
          <p>No claim on file yet.</p>
        )
      ) : null}
    </section>
  );
}
