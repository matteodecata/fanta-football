import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TeamDetail } from './team-detail';

describe('TeamDetail', () => {
  it('legge il dettaglio dalla lega e nasconde la gestione di una squadra avversaria', async () => {
    const paramMap = convertToParamMap({ teamId: '13' });
    const queryParamMap = convertToParamMap({ leagueId: '7' });
    TestBed.configureTestingModule({
      imports: [TeamDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap, queryParamMap }, paramMap: of(paramMap), queryParamMap: of(queryParamMap) } },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamDetail);
    fixture.detectChanges();
    http.expectOne('/api/account/me/leagues').flush([
      { league: { id: 7, name: 'Lega amici' }, team: { id: 12 }, admin: false },
    ]);
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne('/api/leagues/7/teams').flush([
        { teamId: 13, teamName: 'Le Aquile', username: 'Jacopo', budget: 250, totalPoints: 15 },
      ]);
    });
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne('/api/teams/13/players').flush([]);
    });
    http.expectOne('/api/players').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Jacopo');
    expect(page.textContent).toContain('Lega amici');
    expect(page.querySelector('app-rename-team')).toBeNull();
    expect(page.querySelector('app-player-release')).toBeNull();
    http.expectNone('/api/teams/13');
    http.verify();
  });
});
