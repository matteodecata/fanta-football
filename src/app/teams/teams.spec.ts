import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Teams } from './teams';

describe('Teams', () => {
  it('seleziona la sola lega, cerca per allenatore e mantiene la lega nel link alla rosa', async () => {
    TestBed.configureTestingModule({
      imports: [Teams],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Teams);
    fixture.detectChanges();
    http.expectOne('/api/account/me/leagues').flush([
      { league: { id: 7, name: 'Lega amici' }, team: null, admin: false },
    ]);
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne('/api/leagues/7/teams').flush([
      { teamId: 12, teamName: 'I Leoni', username: 'Matteo', budget: 300, totalPoints: 10 },
      { teamId: 13, teamName: 'Le Aquile', username: 'Jacopo', budget: 250, totalPoints: 15 },
      ]);
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const search = page.querySelector<HTMLInputElement>('#teams-search')!;
    search.value = 'JACOPO';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(page.querySelectorAll('.team-card').length).toBe(1);
    expect(page.querySelector('.team-card')?.textContent).toContain('Le Aquile');
    expect(page.querySelector('.team-card a')?.getAttribute('href')).toBe('/teams/13?leagueId=7');
    http.verify();
  });

  it('attende la selezione quando ci sono più leghe', async () => {
    TestBed.configureTestingModule({
      imports: [Teams],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Teams);
    fixture.detectChanges();
    http.expectOne('/api/account/me/leagues').flush([
      { league: { id: 7, name: 'Prima' }, team: null, admin: false },
      { league: { id: 8, name: 'Seconda' }, team: null, admin: false },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    http.expectNone('/api/leagues/7/teams');
    http.expectNone('/api/leagues/8/teams');
    expect((fixture.nativeElement as HTMLElement).querySelector('#teams-search')).toBeNull();
    http.verify();
  });
});
