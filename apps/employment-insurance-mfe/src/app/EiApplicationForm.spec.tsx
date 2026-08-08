import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ContentClient, PageContent } from '@tn4consulting/shared-content-client';
import type { EiApplicationInput } from 'employment-insurance-data-access';
import { EiApplicationForm } from './EiApplicationForm';

/**
 * Deliberately does not call `defineCustomElements()` / render the real
 * Stencil output -- that behavior (an input keystroke really producing a
 * `scdsChange`/`scdsInput` CustomEvent) is already covered by
 * shared-ui-scds-core's own component specs. This test exercises
 * `EiApplicationForm`'s own logic (step validation, conditional fields,
 * final assembly into `EiApplicationInput`) by dispatching the exact
 * CustomEvent shape those real components would dispatch, directly on the
 * `[data-field="..."]` element -- see the component's own comment on why
 * it reads `data-field` via one delegated listener instead of
 * `onScdsChange` JSX props.
 */
const CONTENT: Record<string, PageContent> = {
  'employment-insurance.application.backButton': { title: 'Back', body: '' },
  'employment-insurance.application.nextButton': { title: 'Next', body: '' },
  'employment-insurance.application.submitButton': { title: 'Submit application', body: '' },
  'employment-insurance.application.requiredError': { title: 'This field is required.', body: '' },
  'employment-insurance.application.declarationRequiredError': {
    title: 'You must accept the rights and responsibilities before submitting.',
    body: '',
  },
  'employment-insurance.application.step1Title': { title: 'Personal information', body: '' },
  'employment-insurance.application.step7Title': { title: 'Review and submit', body: '' },
};

const contentClient: ContentClient = {
  getPageContent: jest.fn().mockResolvedValue(null),
  getPageContents: jest.fn().mockResolvedValue(CONTENT),
};

function setField(container: HTMLElement, field: string, detail: unknown, eventName: 'scdsChange' | 'scdsInput' = 'scdsChange') {
  const el = container.querySelector(`[data-field="${field}"]`);
  if (!el) {
    throw new Error(`No element with data-field="${field}"`);
  }
  fireEvent(el, new CustomEvent(eventName, { detail, bubbles: true, composed: true }));
}

async function clickButton(name: string) {
  await userEvent.click(await screen.findByRole('button', { name }));
}

/**
 * `<scds-heading>` renders a real `<h1>`-`<h6>` (with a real heading role)
 * only once the actual Stencil runtime is registered -- deliberately not
 * done in this file (see the top-of-file comment), so step titles are
 * asserted via `findByText` (plain text-content matching, polling until
 * the async `getPageContents` label resolves) rather than
 * `getByRole('heading', ...)`.
 */
async function expectStepHeading(text: string): Promise<void> {
  expect(await screen.findByText(text)).toBeInTheDocument();
}

async function fillStep1(container: HTMLElement) {
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
}

async function fillStep2(container: HTMLElement) {
  setField(container, 'employerName', 'Acme Co.');
  setField(container, 'lastDayWorked', '2026-07-01');
  setField(container, 'jobTitle', 'Warehouse associate');
  setField(container, 'reasonCode', 'shortage_of_work');
  setField(container, 'payRate', 25);
  setField(container, 'payPeriod', 'hourly');
  await clickButton('Next');
}

async function fillStep3(container: HTMLElement, hadOtherEmployers: 'yes' | 'no' = 'no') {
  setField(container, 'hadOtherEmployers', hadOtherEmployers);
  if (hadOtherEmployers === 'yes') {
    setField(container, 'otherEmployerName', 'Second Employer Inc.');
  }
  await clickButton('Next');
}

async function fillStep4(container: HTMLElement) {
  setField(container, 'workersCompensation', 'no');
  setField(container, 'pension', 'no');
  setField(container, 'selfEmployedOrBusiness', 'no');
  setField(container, 'inTrainingProgram', 'no');
  await clickButton('Next');
}

async function fillStep5(container: HTMLElement) {
  setField(container, 'availableImmediately', 'yes');
  setField(container, 'educationLevel', 'high_school');
  await clickButton('Next');
}

async function fillStep6(container: HTMLElement) {
  setField(container, 'directDepositEnrolling', 'no');
  await clickButton('Next');
}

describe('EiApplicationForm', () => {
  it('starts on step 1 of 7', async () => {
    render(<EiApplicationForm contentClient={contentClient} locale="en" submitting={false} onSubmit={jest.fn()} />);

    await expectStepHeading('Personal information');
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('blocks advancing past step 1 until every required field is filled', async () => {
    const { container } = render(
      <EiApplicationForm contentClient={contentClient} locale="en" submitting={false} onSubmit={jest.fn()} />,
    );

    await clickButton('Next');

    const firstNameInput = container.querySelector('[data-field="firstName"]')!;
    expect(firstNameInput.getAttribute('error')).toBe('This field is required.');
    await expectStepHeading('Personal information');
  });

  it('advances to step 2 once step 1 is complete, and Back returns to step 1', async () => {
    const { container } = render(
      <EiApplicationForm contentClient={contentClient} locale="en" submitting={false} onSubmit={jest.fn()} />,
    );

    await fillStep1(container);
    expect(container.querySelector('scds-progress-bar')!.getAttribute('current')).toBe('2');

    await clickButton('Back');
    expect(container.querySelector('scds-progress-bar')!.getAttribute('current')).toBe('1');
  });

  it('only requires otherEmployerName when hadOtherEmployers is "yes"', async () => {
    const { container } = render(
      <EiApplicationForm contentClient={contentClient} locale="en" submitting={false} onSubmit={jest.fn()} />,
    );
    await fillStep1(container);
    await fillStep2(container);

    setField(container, 'hadOtherEmployers', 'yes');
    await clickButton('Next');
    expect(container.querySelector('[data-field="otherEmployerName"]')!.getAttribute('error')).toBe(
      'This field is required.',
    );
    expect(container.querySelector('scds-progress-bar')!.getAttribute('current')).toBe('3');
  });

  it('blocks final submission until the declaration checkbox is accepted', async () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <EiApplicationForm contentClient={contentClient} locale="en" submitting={false} onSubmit={onSubmit} />,
    );
    await fillStep1(container);
    await fillStep2(container);
    await fillStep3(container);
    await fillStep4(container);
    await fillStep5(container);
    await fillStep6(container);

    await expectStepHeading('Review and submit');
    await clickButton('Submit application');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You must accept the rights and responsibilities before submitting.',
    );
  });

  it('submits the fully assembled EiApplicationInput once every step is complete and the declaration is accepted', async () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <EiApplicationForm contentClient={contentClient} locale="en" submitting={false} onSubmit={onSubmit} />,
    );
    await fillStep1(container);
    await fillStep2(container);
    await fillStep3(container, 'yes');
    await fillStep4(container);
    await fillStep5(container);
    await fillStep6(container);

    await userEvent.click(screen.getByRole('checkbox'));
    await clickButton('Submit application');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const application = onSubmit.mock.calls[0][0] as EiApplicationInput;
    expect(application).toEqual<EiApplicationInput>({
      personal: {
        firstName: 'Alex',
        lastName: 'Chen',
        dateOfBirth: '1990-01-01',
        addressLine1: '123 Main St',
        city: 'Ottawa',
        province: 'ON',
        postalCode: 'K1A 0A1',
        phone: '6135550100',
        preferredLanguage: 'en',
      },
      separation: {
        employerName: 'Acme Co.',
        lastDayWorked: '2026-07-01',
        reasonCode: 'shortage_of_work',
        payRate: 25,
        payPeriod: 'hourly',
        jobTitle: 'Warehouse associate',
      },
      otherEmployment: { hadOtherEmployers: true, otherEmployerName: 'Second Employer Inc.' },
      eligibility: {
        workersCompensation: false,
        pension: false,
        selfEmployedOrBusiness: false,
        inTrainingProgram: false,
      },
      availability: { availableImmediately: true, availableFromDate: undefined, educationLevel: 'high_school' },
      directDeposit: { enrolling: false, institutionNumber: undefined, transitNumber: undefined, accountNumber: undefined },
      declarationAccepted: true,
    });
  });
});
