import {
  ContentClient,
  FallbackContentClient,
  StaticContentClient,
  StrapiContentClient,
} from '@tn4consulting/shared-content-client';

export const INTRO_CONTENT_KEY = 'employment-insurance.intro';

export const CLAIMS_CONTENT_KEYS = [
  'employment-insurance.claims.heading',
  'employment-insurance.claims.error',
  'employment-insurance.claims.cardTitle',
  'employment-insurance.claims.status',
  'employment-insurance.claims.empty',
] as const;

export const APPLICATIONS_CONTENT_KEYS = [
  'employment-insurance.applications.heading',
  'employment-insurance.applications.intro',
  'employment-insurance.applications.button',
  'employment-insurance.applications.confirmationDescription',
  'employment-insurance.applications.error',
  // Reused from claims -- "Claim {id}" is the same card title in both.
  'employment-insurance.claims.cardTitle',
] as const;

export const REPORTING_CONTENT_KEYS = [
  'employment-insurance.reporting.heading',
  'employment-insurance.reporting.error',
  'employment-insurance.reporting.noClaim',
  'employment-insurance.reporting.hoursLabel',
  'employment-insurance.reporting.earningsLabel',
  'employment-insurance.reporting.submitButton',
  'employment-insurance.reporting.confirmation',
] as const;

/**
 * The EI application wizard's labels -- condensed from the real
 * Service Canada online application's screens (see
 * `EiApplicationInput`/`EiApplicationForm.tsx` for the full mapping).
 * `otherOption`/`yesOption`/`noOption` are shared across multiple steps
 * (reason-for-separation's "Other", education level's "Other", and every
 * Yes/No picker in the wizard) rather than one key per occurrence.
 */
export const APPLICATION_FORM_CONTENT_KEYS = [
  'employment-insurance.application.breadcrumbHome',
  'employment-insurance.application.breadcrumbEi',
  'employment-insurance.application.breadcrumbCurrent',
  'employment-insurance.application.backButton',
  'employment-insurance.application.nextButton',
  'employment-insurance.application.submitButton',
  'employment-insurance.application.requiredError',
  'employment-insurance.application.yesOption',
  'employment-insurance.application.noOption',
  'employment-insurance.application.otherOption',
  'employment-insurance.application.step1Title',
  'employment-insurance.application.step2Title',
  'employment-insurance.application.step3Title',
  'employment-insurance.application.step4Title',
  'employment-insurance.application.step5Title',
  'employment-insurance.application.step6Title',
  'employment-insurance.application.step7Title',
  'employment-insurance.application.firstNameLabel',
  'employment-insurance.application.lastNameLabel',
  'employment-insurance.application.dateOfBirthLabel',
  'employment-insurance.application.addressLabel',
  'employment-insurance.application.cityLabel',
  'employment-insurance.application.provinceLabel',
  'employment-insurance.application.postalCodeLabel',
  'employment-insurance.application.phoneLabel',
  'employment-insurance.application.preferredLanguageLabel',
  'employment-insurance.application.languageEnglishOption',
  'employment-insurance.application.languageFrenchOption',
  'employment-insurance.application.employerNameLabel',
  'employment-insurance.application.lastDayWorkedLabel',
  'employment-insurance.application.jobTitleLabel',
  'employment-insurance.application.reasonLabel',
  'employment-insurance.application.reasonShortageOption',
  'employment-insurance.application.reasonDismissalOption',
  'employment-insurance.application.reasonQuitOption',
  'employment-insurance.application.payRateLabel',
  'employment-insurance.application.payPeriodLabel',
  'employment-insurance.application.payPeriodHourlyOption',
  'employment-insurance.application.payPeriodWeeklyOption',
  'employment-insurance.application.payPeriodBiweeklyOption',
  'employment-insurance.application.payPeriodMonthlyOption',
  'employment-insurance.application.hadOtherEmployersLabel',
  'employment-insurance.application.otherEmployerNameLabel',
  'employment-insurance.application.workersCompensationLabel',
  'employment-insurance.application.pensionLabel',
  'employment-insurance.application.selfEmployedLabel',
  'employment-insurance.application.trainingProgramLabel',
  'employment-insurance.application.availableImmediatelyLabel',
  'employment-insurance.application.availableFromDateLabel',
  'employment-insurance.application.educationLevelLabel',
  'employment-insurance.application.educationHighSchoolOption',
  'employment-insurance.application.educationCollegeTradeOption',
  'employment-insurance.application.educationUndergraduateOption',
  'employment-insurance.application.educationGraduateOption',
  'employment-insurance.application.enrollDirectDepositLabel',
  'employment-insurance.application.institutionNumberLabel',
  'employment-insurance.application.transitNumberLabel',
  'employment-insurance.application.accountNumberLabel',
  'employment-insurance.application.reviewHeading',
  'employment-insurance.application.declarationLabel',
  'employment-insurance.application.declarationRequiredError',
] as const;

export const REPORTING_STATUS_CONTENT_KEYS = [
  'employment-insurance.reporting-status.heading',
  'employment-insurance.reporting-status.unavailable',
  'employment-insurance.reporting-status.noClaim',
  'employment-insurance.reporting-status.notYetDue',
  'employment-insurance.reporting-status.dueSoon',
  'employment-insurance.reporting-status.overdue',
  'employment-insurance.reporting-status.nextReportDue',
] as const;

/**
 * No CMS configured -> the bilingual fallback (`public/assets/content-fallback/<locale>.json`)
 * directly. CMS configured -> Strapi as primary, same fallback backing it up
 * if Strapi is unreachable/missing a key at runtime -- see `FallbackContentClient`.
 */
export function createContentClient(strapiBaseUrl: string | undefined, assetBaseUrl: string): ContentClient {
  const fallback = new StaticContentClient(assetBaseUrl);
  return strapiBaseUrl ? new FallbackContentClient(new StrapiContentClient(strapiBaseUrl), fallback) : fallback;
}
