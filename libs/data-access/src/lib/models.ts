export type ClaimStatus = 'pending' | 'approved';

/**
 * The EI application wizard's full answer set (`EiApplicationForm.tsx`),
 * grouped the same way as the wizard's 7 steps. Condensed from the real
 * Service Canada online application's ~25 screens -- see
 * EiApplicationForm.tsx's own comment for exactly which real screens
 * map to which group here, and which were deliberately dropped (identity
 * verification/temporary password, T4E delivery preference, Quebec
 * Parental Insurance Plan, farming income, the variable-best-weeks manual
 * entry table, and the training-program sub-flow's detailed questions --
 * either redundant with this PoT's real PKCE sign-in, or genuine
 * edge-case branches not worth the complexity here).
 */
export interface EiApplicationInput {
  personal: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    preferredLanguage: 'en' | 'fr';
  };
  separation: {
    employerName: string;
    lastDayWorked: string;
    reasonCode: 'shortage_of_work' | 'dismissal' | 'quit' | 'other';
    payRate: number;
    payPeriod: 'hourly' | 'weekly' | 'biweekly' | 'monthly';
    jobTitle: string;
  };
  otherEmployment: {
    hadOtherEmployers: boolean;
    otherEmployerName?: string;
  };
  eligibility: {
    workersCompensation: boolean;
    pension: boolean;
    selfEmployedOrBusiness: boolean;
    inTrainingProgram: boolean;
  };
  availability: {
    availableImmediately: boolean;
    availableFromDate?: string;
    educationLevel: 'high_school' | 'college_trade' | 'undergraduate' | 'graduate' | 'other';
  };
  directDeposit: {
    enrolling: boolean;
    institutionNumber?: string;
    transitNumber?: string;
    accountNumber?: string;
  };
  declarationAccepted: boolean;
}

export interface EiClaim {
  id: string;
  applicantSub: string;
  status: ClaimStatus;
  weeklyBenefitAmount: number;
  appliedAt: string;
  application?: EiApplicationInput;
}

export interface EiReport {
  id: string;
  applicantSub: string;
  claimId: string;
  periodStart: string;
  periodEnd: string;
  workedHours: number;
  earnings: number;
  submittedAt: string;
}

export type EiReportingStatusLabel = 'not_yet_due' | 'due_soon' | 'overdue';

export interface EiReportingStatus {
  claimId: string;
  nextReportDue: string;
  daysUntilDue: number;
  status: EiReportingStatusLabel;
}
