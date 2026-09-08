import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TeamRoster } from './team-roster';

describe('TeamRoster', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TeamRoster],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }));

  it('abbina i ruoli per playerId ed esclude i trasferiti senza inventare fantamedie', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 12);
    fixture.detectChanges();
    http.expectOne('/api/teams/12/players').flush([
      { id: 100, playerId: 5, name: 'Mario', surname: 'Rossi', transferDate: null, purchasePrice: 42 },
      { id: 101, playerId: 6, name: 'Ex', surname: 'Giocatore', transferDate: '2026-09-01', purchasePrice: 10 },
    ]);
    http.expectOne('/api/players').flush([{ id: 5, role: 'A' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('tbody tr').length).toBe(1);
    expect(page.textContent).toContain('Attaccante');
    expect(page.textContent).toContain('42');
    expect(page.textContent).toContain('Non disponibile');
    expect(page.querySelector('app-player-release')).toBeNull();
    http.verify();
  });

  it('gestisce il divieto di accesso alla rosa', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 13);
    fixture.detectChanges();
    http.expectOne('/api/teams/13/players').flush({}, { status: 403, statusText: 'Forbidden' });
    http.expectOne('/api/players').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Non hai il permesso');
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
    http.verify();
  });
});
