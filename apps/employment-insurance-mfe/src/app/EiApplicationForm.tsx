// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses.
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import type { Locale } from '@tn4consulting/shared-i18n';
import type { EiApplicationInput } from 'employment-insurance-data-access';
import { APPLICATION_FORM_CONTENT_KEYS } from './content-client';
import { usePageContents } from './use-page-contents';

export interface EiApplicationFormProps {
  contentClient: ContentClient;
  locale: Locale;
  submitting: boolean;
  onSubmit: (application: EiApplicationInput) => void;
}

/**
 * Flat draft shape for the wizard's in-progress answers -- every field is
 * a plain string (or `number | null` for the one currency field) because
 * that's what `scds-text-input`/`scds-picker`/`scds-currency-input` emit;
 * `toApplicationInput` below is the one place this gets converted into the
 * real typed `EiApplicationInput` shape on final submit. Every key here
 * doubles as the `data-field` value set on that field's JSX element (see
 * the component's own comment on why `data-field` + delegated
 * `addEventListener`, not an `onScdsChange` prop).
 */
interface FormDraft {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  preferredLanguage: string;
  employerName: string;
  lastDayWorked: string;
  reasonCode: string;
  payRate: number | null;
  payPeriod: string;
  jobTitle: string;
  hadOtherEmployers: string;
  otherEmployerName: string;
  workersCompensation: string;
  pension: string;
  selfEmployedOrBusiness: string;
  inTrainingProgram: string;
  availableImmediately: string;
  availableFromDate: string;
  educationLevel: string;
  directDepositEnrolling: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  declarationAccepted: boolean;
}

const EMPTY_DRAFT: FormDraft = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  addressLine1: '',
  city: '',
  province: '',
  postalCode: '',
  phone: '',
  preferredLanguage: '',
  employerName: '',
  lastDayWorked: '',
  reasonCode: '',
  payRate: null,
  payPeriod: '',
  jobTitle: '',
  hadOtherEmployers: '',
  otherEmployerName: '',
  workersCompensation: '',
  pension: '',
  selfEmployedOrBusiness: '',
  inTrainingProgram: '',
  availableImmediately: '',
  availableFromDate: '',
  educationLevel: '',
  directDepositEnrolling: '',
  institutionNumber: '',
  transitNumber: '',
  accountNumber: '',
  declarationAccepted: false,
};

/** Every key except `declarationAccepted`, which the review step's plain checkbox validates separately. */
type FieldName = keyof Omit<FormDraft, 'declarationAccepted'> | 'declarationAccepted';

const TOTAL_STEPS = 7;

function isBlank(value: string): boolean {
  return value.trim() === '';
}

/** Missing required fields for the given step, given the current draft. */
function validateStep(step: number, draft: FormDraft): Set<FieldName> {
  const missing = new Set<FieldName>();
  const require = (condition: boolean, field: FieldName) => {
    if (condition) {
      missing.add(field);
    }
  };

  switch (step) {
    case 1:
      require(isBlank(draft.firstName), 'firstName');
      require(isBlank(draft.lastName), 'lastName');
      require(isBlank(draft.dateOfBirth), 'dateOfBirth');
      require(isBlank(draft.addressLine1), 'addressLine1');
      require(isBlank(draft.city), 'city');
      require(isBlank(draft.province), 'province');
      require(isBlank(draft.postalCode), 'postalCode');
      require(isBlank(draft.phone), 'phone');
      require(isBlank(draft.preferredLanguage), 'preferredLanguage');
      break;
    case 2:
      require(isBlank(draft.employerName), 'employerName');
      require(isBlank(draft.lastDayWorked), 'lastDayWorked');
      require(isBlank(draft.reasonCode), 'reasonCode');
      require(draft.payRate === null, 'payRate');
      require(isBlank(draft.payPeriod), 'payPeriod');
      require(isBlank(draft.jobTitle), 'jobTitle');
      break;
    case 3:
      require(isBlank(draft.hadOtherEmployers), 'hadOtherEmployers');
      require(draft.hadOtherEmployers === 'yes' && isBlank(draft.otherEmployerName), 'otherEmployerName');
      break;
    case 4:
      require(isBlank(draft.workersCompensation), 'workersCompensation');
      require(isBlank(draft.pension), 'pension');
      require(isBlank(draft.selfEmployedOrBusiness), 'selfEmployedOrBusiness');
      require(isBlank(draft.inTrainingProgram), 'inTrainingProgram');
      break;
    case 5:
      require(isBlank(draft.availableImmediately), 'availableImmediately');
      require(draft.availableImmediately === 'no' && isBlank(draft.availableFromDate), 'availableFromDate');
      require(isBlank(draft.educationLevel), 'educationLevel');
      break;
    case 6:
      require(isBlank(draft.directDepositEnrolling), 'directDepositEnrolling');
      require(draft.directDepositEnrolling === 'yes' && isBlank(draft.institutionNumber), 'institutionNumber');
      require(draft.directDepositEnrolling === 'yes' && isBlank(draft.transitNumber), 'transitNumber');
      require(draft.directDepositEnrolling === 'yes' && isBlank(draft.accountNumber), 'accountNumber');
      break;
    case 7:
      require(!draft.declarationAccepted, 'declarationAccepted');
      break;
  }
  return missing;
}

function toApplicationInput(draft: FormDraft): EiApplicationInput {
  const hadOtherEmployers = draft.hadOtherEmployers === 'yes';
  const availableImmediately = draft.availableImmediately === 'yes';
  const enrolling = draft.directDepositEnrolling === 'yes';
  return {
    personal: {
      firstName: draft.firstName,
      lastName: draft.lastName,
      dateOfBirth: draft.dateOfBirth,
      addressLine1: draft.addressLine1,
      city: draft.city,
      province: draft.province,
      postalCode: draft.postalCode,
      phone: draft.phone,
      preferredLanguage: draft.preferredLanguage === 'fr' ? 'fr' : 'en',
    },
    separation: {
      employerName: draft.employerName,
      lastDayWorked: draft.lastDayWorked,
      reasonCode: draft.reasonCode as EiApplicationInput['separation']['reasonCode'],
      payRate: draft.payRate ?? 0,
      payPeriod: draft.payPeriod as EiApplicationInput['separation']['payPeriod'],
      jobTitle: draft.jobTitle,
    },
    otherEmployment: {
      hadOtherEmployers,
      otherEmployerName: hadOtherEmployers ? draft.otherEmployerName : undefined,
    },
    eligibility: {
      workersCompensation: draft.workersCompensation === 'yes',
      pension: draft.pension === 'yes',
      selfEmployedOrBusiness: draft.selfEmployedOrBusiness === 'yes',
      inTrainingProgram: draft.inTrainingProgram === 'yes',
    },
    availability: {
      availableImmediately,
      availableFromDate: availableImmediately ? undefined : draft.availableFromDate,
      educationLevel: draft.educationLevel as EiApplicationInput['availability']['educationLevel'],
    },
    directDeposit: {
      enrolling,
      institutionNumber: enrolling ? draft.institutionNumber : undefined,
      transitNumber: enrolling ? draft.transitNumber : undefined,
      accountNumber: enrolling ? draft.accountNumber : undefined,
    },
    declarationAccepted: draft.declarationAccepted,
  };
}

/**
 * A 7-step wizard condensed from the real Service Canada online EI
 * application (confirmed screen by screen against a citizen's-guide
 * walkthrough of the live canada.ca flow plus the official "Regular
 * benefits" checklist). Real screens folded into each step below; screens
 * dropped entirely are noted at the bottom.
 *
 *  1. Personal information       <- Identity/Personal Information pages
 *  2. Employment separation      <- Last Employer Information, Reasons for
 *                                    Separation, Rate of Pay, Job Title,
 *                                    ROE Information
 *  3. Other employment           <- Other Employers
 *  4. Eligibility                <- Workers' Compensation, Pensions,
 *                                    Business Relationship, Course or
 *                                    Training (yes/no gate only)
 *  5. Availability & education   <- Workforce History/availability +
 *                                    education level
 *  6. Direct deposit             <- Banking Information, Direct Deposit
 *                                    Information
 *  7. Review & declaration       <- Rights and Responsibilities
 *
 * Deliberately dropped (not silently missed -- see the plan/TODO):
 * identity verification & temporary password (redundant with this PoT's
 * real PKCE sign-in), Income Tax/T4E delivery preference, Quebec Parental
 * Insurance Plan, farming income, the "variable best weeks" manual
 * per-week earnings table, and the training-program sub-flow's detailed
 * questions.
 *
 * No React Router -- remotes have no internal routing in this family (see
 * the platform repo's CLAUDE.md, "Security: defense in depth"); step state
 * is plain `useState`. Every field is a controlled prop, same as
 * `scds-badge`'s `tone` -- this component owns no persisted state itself,
 * it just collects answers and hands the assembled `EiApplicationInput` to
 * `onSubmit` once the declaration is accepted.
 *
 * **Field changes are read via one delegated `addEventListener` pair on
 * this component's own root `<div>`, not `onScdsChange`/`onScdsInput` JSX
 * props.** Confirmed empirically (see `scds-elements.d.ts`'s own comment):
 * React 19 does not wire an `onScdsChange`-shaped prop to a real
 * `addEventListener` call for a custom element the way it does for a
 * recognized native event like `onClick`/`onChange` -- it silently sets an
 * inert same-named property instead, so the handler would compile but
 * never fire. `scdsChange`/`scdsInput` are real `composed: true` custom
 * events, so they bubble out through every element's shadow boundary up
 * to this root div, where one listener reads `event.target`'s `data-field`
 * attribute (set on every field below) to know which `FormDraft` key to
 * update -- every `data-field` value is deliberately spelled to match a
 * `FormDraft` key exactly, so the generic handler needs no per-field
 * mapping table.
 */
export function EiApplicationForm({ contentClient, locale, submitting, onSubmit }: EiApplicationFormProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Set<FieldName>>(new Set());
  const content = usePageContents(contentClient, APPLICATION_FORM_CONTENT_KEYS, locale);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    function handleFieldEvent(event: Event): void {
      const field = (event.target as HTMLElement).getAttribute('data-field');
      if (!field) {
        return;
      }
      const detail = (event as CustomEvent).detail;
      setDraft((prev) => ({ ...prev, [field]: detail }) as FormDraft);
    }
    root.addEventListener('scdsChange', handleFieldEvent);
    root.addEventListener('scdsInput', handleFieldEvent);
    return () => {
      root.removeEventListener('scdsChange', handleFieldEvent);
      root.removeEventListener('scdsInput', handleFieldEvent);
    };
  }, []);

  function label(key: (typeof APPLICATION_FORM_CONTENT_KEYS)[number]): string {
    return content[key]?.title ?? key;
  }

  function fieldError(field: FieldName): string | undefined {
    return errors.has(field) ? label('employment-insurance.application.requiredError') : undefined;
  }

  function goBack(): void {
    setErrors(new Set());
    setStep((current) => Math.max(1, current - 1));
  }

  function goNext(): void {
    const missing = validateStep(step, draft);
    if (missing.size > 0) {
      setErrors(missing);
      return;
    }
    setErrors(new Set());
    if (step === TOTAL_STEPS) {
      onSubmit(toApplicationInput(draft));
      return;
    }
    setStep((current) => current + 1);
  }

  const stepTitles = [1, 2, 3, 4, 5, 6, 7].map((n) =>
    label(`employment-insurance.application.step${n}Title` as (typeof APPLICATION_FORM_CONTENT_KEYS)[number]),
  );

  const stepStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--scds-space-5)' };

  function renderStep1() {
    return (
      <div style={stepStyle}>
        <scds-text-input
          data-field="firstName"
          label={label('employment-insurance.application.firstNameLabel')}
          value={draft.firstName}
          required
          error={fieldError('firstName')}
        />
        <scds-text-input
          data-field="lastName"
          label={label('employment-insurance.application.lastNameLabel')}
          value={draft.lastName}
          required
          error={fieldError('lastName')}
        />
        <scds-text-input
          data-field="dateOfBirth"
          label={label('employment-insurance.application.dateOfBirthLabel')}
          type="date"
          value={draft.dateOfBirth}
          required
          error={fieldError('dateOfBirth')}
        />
        <scds-text-input
          data-field="addressLine1"
          label={label('employment-insurance.application.addressLabel')}
          value={draft.addressLine1}
          required
          error={fieldError('addressLine1')}
        />
        <scds-text-input
          data-field="city"
          label={label('employment-insurance.application.cityLabel')}
          value={draft.city}
          required
          error={fieldError('city')}
        />
        <scds-text-input
          data-field="province"
          label={label('employment-insurance.application.provinceLabel')}
          value={draft.province}
          required
          error={fieldError('province')}
        />
        <scds-text-input
          data-field="postalCode"
          label={label('employment-insurance.application.postalCodeLabel')}
          value={draft.postalCode}
          required
          error={fieldError('postalCode')}
        />
        <scds-text-input
          data-field="phone"
          label={label('employment-insurance.application.phoneLabel')}
          type="tel"
          value={draft.phone}
          required
          error={fieldError('phone')}
        />
        <scds-picker
          data-field="preferredLanguage"
          label={label('employment-insurance.application.preferredLanguageLabel')}
          value={draft.preferredLanguage}
          required
          error={fieldError('preferredLanguage')}
        >
          <scds-picker-option value="en">{label('employment-insurance.application.languageEnglishOption')}</scds-picker-option>
          <scds-picker-option value="fr">{label('employment-insurance.application.languageFrenchOption')}</scds-picker-option>
        </scds-picker>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div style={stepStyle}>
        <scds-text-input
          data-field="employerName"
          label={label('employment-insurance.application.employerNameLabel')}
          value={draft.employerName}
          required
          error={fieldError('employerName')}
        />
        <scds-text-input
          data-field="lastDayWorked"
          label={label('employment-insurance.application.lastDayWorkedLabel')}
          type="date"
          value={draft.lastDayWorked}
          required
          error={fieldError('lastDayWorked')}
        />
        <scds-text-input
          data-field="jobTitle"
          label={label('employment-insurance.application.jobTitleLabel')}
          value={draft.jobTitle}
          required
          error={fieldError('jobTitle')}
        />
        <scds-picker
          data-field="reasonCode"
          label={label('employment-insurance.application.reasonLabel')}
          value={draft.reasonCode}
          required
          error={fieldError('reasonCode')}
        >
          <scds-picker-option value="shortage_of_work">
            {label('employment-insurance.application.reasonShortageOption')}
          </scds-picker-option>
          <scds-picker-option value="dismissal">{label('employment-insurance.application.reasonDismissalOption')}</scds-picker-option>
          <scds-picker-option value="quit">{label('employment-insurance.application.reasonQuitOption')}</scds-picker-option>
          <scds-picker-option value="other">{label('employment-insurance.application.otherOption')}</scds-picker-option>
        </scds-picker>
        <scds-currency-input
          data-field="payRate"
          label={label('employment-insurance.application.payRateLabel')}
          value={draft.payRate ?? undefined}
          required
          error={fieldError('payRate')}
        />
        <scds-picker
          data-field="payPeriod"
          label={label('employment-insurance.application.payPeriodLabel')}
          value={draft.payPeriod}
          display="select"
          required
          error={fieldError('payPeriod')}
        >
          <scds-picker-option value="hourly">{label('employment-insurance.application.payPeriodHourlyOption')}</scds-picker-option>
          <scds-picker-option value="weekly">{label('employment-insurance.application.payPeriodWeeklyOption')}</scds-picker-option>
          <scds-picker-option value="biweekly">
            {label('employment-insurance.application.payPeriodBiweeklyOption')}
          </scds-picker-option>
          <scds-picker-option value="monthly">{label('employment-insurance.application.payPeriodMonthlyOption')}</scds-picker-option>
        </scds-picker>
      </div>
    );
  }

  function renderYesNoPicker(
    field: FieldName,
    labelKey: (typeof APPLICATION_FORM_CONTENT_KEYS)[number],
    value: string,
  ) {
    return (
      <scds-picker data-field={field} label={label(labelKey)} value={value} required error={fieldError(field)}>
        <scds-picker-option value="yes">{label('employment-insurance.application.yesOption')}</scds-picker-option>
        <scds-picker-option value="no">{label('employment-insurance.application.noOption')}</scds-picker-option>
      </scds-picker>
    );
  }

  function renderStep3() {
    return (
      <div style={stepStyle}>
        {renderYesNoPicker(
          'hadOtherEmployers',
          'employment-insurance.application.hadOtherEmployersLabel',
          draft.hadOtherEmployers,
        )}
        {draft.hadOtherEmployers === 'yes' ? (
          <scds-text-input
            data-field="otherEmployerName"
            label={label('employment-insurance.application.otherEmployerNameLabel')}
            value={draft.otherEmployerName}
            required
            error={fieldError('otherEmployerName')}
          />
        ) : null}
      </div>
    );
  }

  function renderStep4() {
    return (
      <div style={stepStyle}>
        {renderYesNoPicker(
          'workersCompensation',
          'employment-insurance.application.workersCompensationLabel',
          draft.workersCompensation,
        )}
        {renderYesNoPicker('pension', 'employment-insurance.application.pensionLabel', draft.pension)}
        {renderYesNoPicker(
          'selfEmployedOrBusiness',
          'employment-insurance.application.selfEmployedLabel',
          draft.selfEmployedOrBusiness,
        )}
        {renderYesNoPicker(
          'inTrainingProgram',
          'employment-insurance.application.trainingProgramLabel',
          draft.inTrainingProgram,
        )}
      </div>
    );
  }

  function renderStep5() {
    return (
      <div style={stepStyle}>
        {renderYesNoPicker(
          'availableImmediately',
          'employment-insurance.application.availableImmediatelyLabel',
          draft.availableImmediately,
        )}
        {draft.availableImmediately === 'no' ? (
          <scds-text-input
            data-field="availableFromDate"
            label={label('employment-insurance.application.availableFromDateLabel')}
            type="date"
            value={draft.availableFromDate}
            required
            error={fieldError('availableFromDate')}
          />
        ) : null}
        <scds-picker
          data-field="educationLevel"
          label={label('employment-insurance.application.educationLevelLabel')}
          value={draft.educationLevel}
          display="select"
          required
          error={fieldError('educationLevel')}
        >
          <scds-picker-option value="high_school">
            {label('employment-insurance.application.educationHighSchoolOption')}
          </scds-picker-option>
          <scds-picker-option value="college_trade">
            {label('employment-insurance.application.educationCollegeTradeOption')}
          </scds-picker-option>
          <scds-picker-option value="undergraduate">
            {label('employment-insurance.application.educationUndergraduateOption')}
          </scds-picker-option>
          <scds-picker-option value="graduate">
            {label('employment-insurance.application.educationGraduateOption')}
          </scds-picker-option>
          <scds-picker-option value="other">{label('employment-insurance.application.otherOption')}</scds-picker-option>
        </scds-picker>
      </div>
    );
  }

  function renderStep6() {
    return (
      <div style={stepStyle}>
        {renderYesNoPicker(
          'directDepositEnrolling',
          'employment-insurance.application.enrollDirectDepositLabel',
          draft.directDepositEnrolling,
        )}
        {draft.directDepositEnrolling === 'yes' ? (
          <>
            <scds-text-input
              data-field="institutionNumber"
              label={label('employment-insurance.application.institutionNumberLabel')}
              value={draft.institutionNumber}
              required
              maxlength={3}
              error={fieldError('institutionNumber')}
            />
            <scds-text-input
              data-field="transitNumber"
              label={label('employment-insurance.application.transitNumberLabel')}
              value={draft.transitNumber}
              required
              maxlength={5}
              error={fieldError('transitNumber')}
            />
            <scds-text-input
              data-field="accountNumber"
              label={label('employment-insurance.application.accountNumberLabel')}
              value={draft.accountNumber}
              required
              error={fieldError('accountNumber')}
            />
          </>
        ) : null}
      </div>
    );
  }

  function renderStep7() {
    const application = toApplicationInput(draft);
    return (
      <div style={stepStyle}>
        <scds-heading tag="h2">{label('employment-insurance.application.reviewHeading')}</scds-heading>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: 'var(--scds-space-2) var(--scds-space-4)',
            margin: 0,
          }}
        >
          <dt>{label('employment-insurance.application.firstNameLabel')}</dt>
          <dd style={{ margin: 0 }}>
            {application.personal.firstName} {application.personal.lastName}
          </dd>
          <dt>{label('employment-insurance.application.employerNameLabel')}</dt>
          <dd style={{ margin: 0 }}>{application.separation.employerName}</dd>
          <dt>{label('employment-insurance.application.jobTitleLabel')}</dt>
          <dd style={{ margin: 0 }}>{application.separation.jobTitle}</dd>
          <dt>{label('employment-insurance.application.payRateLabel')}</dt>
          <dd style={{ margin: 0 }}>${application.separation.payRate.toFixed(2)}</dd>
          <dt>{label('employment-insurance.application.educationLevelLabel')}</dt>
          <dd style={{ margin: 0 }}>{draft.educationLevel}</dd>
        </dl>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--scds-space-2)' }}>
          <input
            type="checkbox"
            checked={draft.declarationAccepted}
            onChange={(e) => setDraft((prev) => ({ ...prev, declarationAccepted: e.target.checked }))}
          />
          <span>{label('employment-insurance.application.declarationLabel')}</span>
        </label>
        {errors.has('declarationAccepted') ? (
          <p role="alert" style={{ margin: 0, color: 'var(--scds-color-status-danger-text)' }}>
            {label('employment-insurance.application.declarationRequiredError')}
          </p>
        ) : null}
      </div>
    );
  }

  const steps: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
  };

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--scds-space-5)', maxWidth: '40rem' }}>
      <scds-breadcrumbs>
        <scds-breadcrumbs-item href="/">{label('employment-insurance.application.breadcrumbHome')}</scds-breadcrumbs-item>
        <scds-breadcrumbs-item href="/employment-insurance">
          {label('employment-insurance.application.breadcrumbEi')}
        </scds-breadcrumbs-item>
        <scds-breadcrumbs-item>{label('employment-insurance.application.breadcrumbCurrent')}</scds-breadcrumbs-item>
      </scds-breadcrumbs>
      <scds-progress-bar current={step} total={TOTAL_STEPS} step-label={stepTitles[step - 1]} />
      <scds-heading tag="h2">{stepTitles[step - 1]}</scds-heading>
      {steps[step]()}
      <div style={{ display: 'flex', gap: 'var(--scds-space-3)' }}>
        {step > 1 ? (
          <button type="button" onClick={goBack} disabled={submitting}>
            {label('employment-insurance.application.backButton')}
          </button>
        ) : null}
        <button type="button" onClick={goNext} disabled={submitting}>
          {step === TOTAL_STEPS
            ? label('employment-insurance.application.submitButton')
            : label('employment-insurance.application.nextButton')}
        </button>
      </div>
    </div>
  );
}
