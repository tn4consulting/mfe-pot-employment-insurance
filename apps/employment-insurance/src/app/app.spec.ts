import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import {
  EMPLOYMENT_INSURANCE_API_CLIENT,
  EmploymentInsuranceApiClient,
} from 'employment-insurance-data-access';
import { App } from './app';

describe('App', () => {
  const apiClient: jest.Mocked<EmploymentInsuranceApiClient> = {
    applyForEi: jest.fn(),
    getClaim: jest.fn().mockResolvedValue(null),
    submitReport: jest.fn(),
  };

  afterEach(() => clearSession());

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: {
            en: { auth: { signInRequired: 'You need to sign in to manage your Employment Insurance.' } },
            fr: { auth: { signInRequired: 'Vous devez ouvrir une session.' } },
          },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: EMPLOYMENT_INSURANCE_API_CLIENT, useValue: apiClient },
      ],
    }).compileComponents();
  }

  it('should create the app', async () => {
    storeSession(createMockSession());
    await setup();
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders its feature components when the claim is present', async () => {
    storeSession(createMockSession());
    await setup();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('lib-employment-insurance-feature-applications')).not.toBeNull();
  });

  it('blocks its own content when there is no active session, independent of the shell', async () => {
    clearSession();
    await setup();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('lib-employment-insurance-feature-applications')).toBeNull();
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('sign in');
  });
});
