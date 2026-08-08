import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import type { EmploymentInsuranceApiClient } from 'employment-insurance-data-access';
import { Applications } from './Applications';

const contentClient: ContentClient = {
  getPageContent: jest.fn().mockResolvedValue(null),
  getPageContents: jest.fn().mockResolvedValue({
    'employment-insurance.applications.heading': { title: 'Employment Insurance — Apply', body: '' },
    'employment-insurance.applications.confirmationDescription': {
      title: 'Status: {status}, weekly benefit: ${amount}.',
      body: '',
    },
    'employment-insurance.applications.error': { title: 'EI applications are temporarily unavailable.', body: '' },
    'employment-insurance.claims.cardTitle': { title: 'Claim {id}', body: '' },
    'employment-insurance.application.nextButton': { title: 'Next', body: '' },
    'employment-insurance.application.submitButton': { title: 'Submit application', body: '' },
  }),
};

function fakeApiClient(overrides: Partial<EmploymentInsuranceApiClient> = {}): EmploymentInsuranceApiClient {
  return {
    applyForEi: jest.fn(),
    getClaim: jest.fn(),
    getReportingStatus: jest.fn(),
    submitReport: jest.fn(),
    ...overrides,
  };
}

/** Same technique as EiApplicationForm.spec.tsx -- see its own top-of-file comment. */
function setField(container: HTMLElement, field: string, detail: unknown) {
  const el = container.querySelector(`[data-field="${field}"]`);
  if (!el) {
    throw new Error(`No element with data-field="${field}"`);
  }
  fireEvent(el, new CustomEvent('scdsChange', { detail, bubbles: true, composed: true }));
}

async function clickButton(name: string) {
  await userEvent.click(await screen.findByRole('button', { name }));
}

/** Drives the whole 7-step wizard to completion with a minimal valid answer set. */
async function completeWizard(container: HTMLElement) {
  setField(container, 'firstName', 'Alex');
  setField(container, 'lastName', 'Chen');
  setField(container, 'dateOfBirth', '1990-01-01');
  setField(container, 'addressLine1', '123 Main St');
  setField(container, 'city', 'Ottawa');
  setField(container, 'province', 'ON');
  setField(container, 'postalCode', 'K1A 0A1');
  setField(container, 'phone', '6135550100');
  setField(container, 'preferredLanguage', 'en');
  await clickButton('Next');

  setField(container, 'employerName', 'Acme Co.');
  setField(container, 'lastDayWorked', '2026-07-01');
  setField(container, 'jobTitle', 'Warehouse associate');
  setField(container, 'reasonCode', 'shortage_of_work');
  setField(container, 'payRate', 25);
  setField(container, 'payPeriod', 'hourly');
  await clickButton('Next');

  setField(container, 'hadOtherEmployers', 'no');
  await clickButton('Next');

  setField(container, 'workersCompensation', 'no');
  setField(container, 'pension', 'no');
  setField(container, 'selfEmployedOrBusiness', 'no');
  setField(container, 'inTrainingProgram', 'no');
  await clickButton('Next');

  setField(container, 'availableImmediately', 'yes');
  setField(container, 'educationLevel', 'high_school');
  await clickButton('Next');

  setField(container, 'directDepositEnrolling', 'no');
  await clickButton('Next');

  await userEvent.click(screen.getByRole('checkbox'));
  await clickButton('Submit application');
}

describe('Applications', () => {
  afterEach(() => clearSession());

  it('submits the wizard and renders the confirmation card', async () => {
    storeSession(createMockSession());
    const apiClient = fakeApiClient({
      applyForEi: jest
        .fn()
        .mockResolvedValue({ id: 'claim-1', status: 'approved', weeklyBenefitAmount: 450, appliedAt: '' }),
    });

    const { container } = render(<Applications apiClient={apiClient} contentClient={contentClient} locale="en" />);
    await completeWizard(container);

    await waitFor(() => {
      const card = screen.getByRole('status');
      expect(card.getAttribute('card-title')).toBe('Claim claim-1');
      expect(card.getAttribute('description')).toBe('Status: approved, weekly benefit: $450.00.');
      expect(card.getAttribute('tone')).toBe('success');
    });
    expect(apiClient.applyForEi).toHaveBeenCalledWith(
      'mock-citizen-001',
      expect.objectContaining({ declarationAccepted: true }),
    );
  });

  it('shows an alert when the application fails', async () => {
    storeSession(createMockSession());
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const apiClient = fakeApiClient({ applyForEi: jest.fn().mockRejectedValue(new Error('boom')) });

    const { container } = render(<Applications apiClient={apiClient} contentClient={contentClient} locale="en" />);
    await completeWizard(container);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable'));
  });
});
