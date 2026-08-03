import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContentClient } from '@tn4consulting/shared-content-client';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import {
  EMPLOYMENT_INSURANCE_API_CLIENT,
  EmploymentInsuranceApiClient,
} from 'employment-insurance-data-access';
import { App } from './app';
import { CONTENT_CLIENT } from './content-client.token';

describe('App', () => {
  const apiClient: jest.Mocked<EmploymentInsuranceApiClient> = {
    applyForEi: jest.fn(),
    getClaim: jest.fn().mockResolvedValue(null),
    getReportingStatus: jest.fn().mockResolvedValue(null),
    submitReport: jest.fn(),
  };
  const contentClient: jest.Mocked<ContentClient> = {
    getPageContent: jest.fn().mockResolvedValue(null),
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
        { provide: CONTENT_CLIENT, useValue: contentClient },
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

  it('renders intro content fetched via ContentClient', async () => {
    storeSession(createMockSession());
    contentClient.getPageContent.mockResolvedValue({
      key: 'employment-insurance.intro',
      title: 'Employment Insurance',
      body: 'Apply for Employment Insurance benefits, check your claim status, and submit your reports.',
    });
    await setup();
    const fixture = TestBed.createComponent(App);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Employment Insurance');
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
