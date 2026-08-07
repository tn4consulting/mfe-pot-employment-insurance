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
