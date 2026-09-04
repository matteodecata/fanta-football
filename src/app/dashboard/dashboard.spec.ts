import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('mostra lo stato di caricamento per leghe e inviti', () => {
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.user-leagues')?.getAttribute('aria-busy')).toBe('true');
    expect(page.querySelector('.pending-invites')?.getAttribute('aria-busy')).toBe('true');
    expect(page.querySelector('.leagues-status')).not.toBeNull();
    expect(page.querySelector('.invites-status')).not.toBeNull();

    httpTesting.expectOne('/api/account/me/leagues').flush([]);
    httpTesting.expectOne('/api/invites/pending').flush([]);
  });

  it('mostra gli stati vuoti quando le API non restituiscono elementi', async () => {
    httpTesting.expectOne('/api/account/me/leagues').flush([]);
    httpTesting.expectOne('/api/invites/pending').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.empty-leagues')?.textContent).toContain(
      'Non partecipi ancora a nessuna lega',
    );
    expect(page.querySelector('.empty-invites')?.textContent).toContain('Nessun invito in sospeso');
  });

  it('mostra gli errori quando il caricamento delle API fallisce', async () => {
    httpTesting
      .expectOne('/api/account/me/leagues')
      .flush('Errore', { status: 500, statusText: 'Server Error' });
    httpTesting
      .expectOne('/api/invites/pending')
      .flush('Errore', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.leagues-error')).not.toBeNull();
    expect(page.querySelector('.invites-error')).not.toBeNull();
    expect(page.querySelectorAll('button').length).toBe(2);
  });

  it('mostra leghe e inviti quando il caricamento ha successo', async () => {
    httpTesting.expectOne('/api/account/me/leagues').flush([
      {
        league: { id: 7, name: 'Lega del lunedì' },
        team: {
          id: 12,
          name: 'Gli Imbattibili',
          userId: 3,
          leagueId: 7,
          leagueName: 'Lega del lunedì',
          budget: 500,
          totalPoints: 42.5,
        },
        admin: true,
      },
    ]);
    httpTesting.expectOne('/api/invites/pending').flush([
      {
        id: 21,
        leagueId: 9,
        invitedByUserId: 4,
        invitedUserId: 3,
        status: 'PENDING',
        sentDate: '2026-09-04T10:00:00Z',
        responseDate: null,
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.league-card')?.textContent).toContain('Lega del lunedì');
    expect(page.querySelector('.league-card')?.textContent).toContain('Gli Imbattibili');
    expect(page.querySelector('.invite-item')?.textContent).toContain('Invito alla lega n. 9');
    expect(page.querySelector('.empty-leagues')).toBeNull();
    expect(page.querySelector('.empty-invites')).toBeNull();
  });
});
