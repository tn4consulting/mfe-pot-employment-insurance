import {
  ContentClient,
  PageContent,
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

function entry(key: string, en: string, fr: string): Record<'en' | 'fr', PageContent> {
  return {
    en: { key, title: en, body: '' },
    fr: { key, title: fr, body: '' },
  };
}

// Baked fallback for a no-CMS build -- kept in sync with the seed data in
// mfe-pot-platform's tools/cms/strapi/src/index.ts by hand for now; see
// mfe-pot-dashboard's own content-client.token.ts for the same pattern.
const STATIC_CONTENT: Record<string, Record<'en' | 'fr', PageContent>> = {
  [INTRO_CONTENT_KEY]: {
    en: {
      key: INTRO_CONTENT_KEY,
      title: 'Employment Insurance',
      body: 'Apply for Employment Insurance benefits, check your claim status, and submit your reports.',
    },
    fr: {
      key: INTRO_CONTENT_KEY,
      title: 'Assurance-emploi',
      body: "Faites une demande de prestations d'assurance-emploi, consultez l'état de votre demande et soumettez vos déclarations.",
    },
  },
  'employment-insurance.claims.heading': entry('employment-insurance.claims.heading', 'Claim status', 'État de la demande'),
  'employment-insurance.claims.error': entry(
    'employment-insurance.claims.error',
    'Claim status is temporarily unavailable.',
    "L'état de la demande est temporairement indisponible.",
  ),
  'employment-insurance.claims.cardTitle': entry('employment-insurance.claims.cardTitle', 'Claim {id}', 'Demande {id}'),
  'employment-insurance.claims.status': entry('employment-insurance.claims.status', 'Status: {status}.', 'État : {status}.'),
  'employment-insurance.claims.empty': entry(
    'employment-insurance.claims.empty',
    'No claim on file yet.',
    'Aucune demande au dossier pour le moment.',
  ),
  'employment-insurance.applications.heading': entry(
    'employment-insurance.applications.heading',
    'Employment Insurance — Apply',
    'Assurance-emploi — Faire une demande',
  ),
  'employment-insurance.applications.intro': entry(
    'employment-insurance.applications.intro',
    'Apply for Employment Insurance benefits.',
    "Faites une demande de prestations d'assurance-emploi.",
  ),
  'employment-insurance.applications.button': entry('employment-insurance.applications.button', 'Apply for EI', "Faire une demande d'AE"),
  'employment-insurance.applications.confirmationDescription': entry(
    'employment-insurance.applications.confirmationDescription',
    'Status: {status}, weekly benefit: ${amount}.',
    'État : {status}, prestation hebdomadaire : {amount} $.',
  ),
  'employment-insurance.applications.error': entry(
    'employment-insurance.applications.error',
    'EI applications are temporarily unavailable.',
    "Les demandes d'AE sont temporairement indisponibles.",
  ),
  'employment-insurance.reporting.heading': entry(
    'employment-insurance.reporting.heading',
    'Submit your EI report',
    "Soumettre votre déclaration d'AE",
  ),
  'employment-insurance.reporting.error': entry(
    'employment-insurance.reporting.error',
    'EI reporting is temporarily unavailable.',
    "La déclaration d'AE est temporairement indisponible.",
  ),
  'employment-insurance.reporting.noClaim': entry(
    'employment-insurance.reporting.noClaim',
    'You need an active EI claim before you can submit a report.',
    "Vous devez avoir une demande d'AE active avant de pouvoir soumettre une déclaration.",
  ),
  'employment-insurance.reporting.hoursLabel': entry(
    'employment-insurance.reporting.hoursLabel',
    'Hours worked this period',
    'Heures travaillées durant cette période',
  ),
  'employment-insurance.reporting.earningsLabel': entry(
    'employment-insurance.reporting.earningsLabel',
    'Earnings this period ($)',
    'Revenus durant cette période (en dollars)',
  ),
  'employment-insurance.reporting.submitButton': entry('employment-insurance.reporting.submitButton', 'Submit report', 'Soumettre la déclaration'),
  'employment-insurance.reporting.confirmation': entry(
    'employment-insurance.reporting.confirmation',
    'Report {id} submitted for {periodStart} to {periodEnd}.',
    'Déclaration {id} soumise pour la période du {periodStart} au {periodEnd}.',
  ),
  'employment-insurance.reporting-status.heading': entry(
    'employment-insurance.reporting-status.heading',
    'EI Reporting Status',
    "État de la déclaration d'assurance-emploi",
  ),
  'employment-insurance.reporting-status.unavailable': entry(
    'employment-insurance.reporting-status.unavailable',
    'EI reporting status is temporarily unavailable.',
    "L'état de la déclaration d'assurance-emploi est temporairement indisponible.",
  ),
  'employment-insurance.reporting-status.noClaim': entry(
    'employment-insurance.reporting-status.noClaim',
    'No active EI claim on file.',
    "Aucune demande d'assurance-emploi active au dossier.",
  ),
  'employment-insurance.reporting-status.notYetDue': entry('employment-insurance.reporting-status.notYetDue', 'Not yet due', 'Pas encore requise'),
  'employment-insurance.reporting-status.dueSoon': entry('employment-insurance.reporting-status.dueSoon', 'Due soon', 'Bientôt requise'),
  'employment-insurance.reporting-status.overdue': entry('employment-insurance.reporting-status.overdue', 'Overdue', 'En retard'),
  'employment-insurance.reporting-status.nextReportDue': entry(
    'employment-insurance.reporting-status.nextReportDue',
    'Next report due {date} ({days} days)',
    'Prochaine déclaration due le {date} ({days} jours)',
  ),
};

export function createContentClient(strapiBaseUrl: string | undefined): ContentClient {
  return strapiBaseUrl ? new StrapiContentClient(strapiBaseUrl) : new StaticContentClient(STATIC_CONTENT);
}
