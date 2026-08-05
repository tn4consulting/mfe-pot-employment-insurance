// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses.
import * as React from 'react';
import { useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { EiClaim, EmploymentInsuranceApiClient } from 'employment-insurance-data-access';

export interface ApplicationsProps {
  apiClient: EmploymentInsuranceApiClient;
}

function confirmationTone(claim: EiClaim): 'success' | undefined {
  return claim.status === 'approved' ? 'success' : undefined;
}

function confirmationDescription(claim: EiClaim): string {
  return `Status: ${claim.status}, weekly benefit: $${claim.weeklyBenefitAmount.toFixed(2)}.`;
}

export function Applications({ apiClient }: ApplicationsProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<EiClaim | null>(null);
  const [submitError, setSubmitError] = useState(false);

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
      <h1>Employment Insurance — Apply</h1>
      {confirmation ? (
        <scds-card
          role="status"
          card-title={`Claim ${confirmation.id}`}
          description={confirmationDescription(confirmation)}
          tone={confirmationTone(confirmation)}
        />
      ) : submitError ? (
        <p role="alert">EI applications are temporarily unavailable.</p>
      ) : (
        <>
          <p>Apply for Employment Insurance benefits.</p>
          <button type="button" disabled={submitting} onClick={() => void apply()}>
            Apply for EI
          </button>
        </>
      )}
    </section>
  );
}
