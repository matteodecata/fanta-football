import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TeamRoster } from './team-roster';

describe('TeamRoster', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TeamRoster],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }));

  it('mostra le fantamedie API con due decimali, zero e null senza chiamate aggiuntive', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 12);
    fixture.detectChanges();
    http.expectOne('/api/teams/12/players').flush([
      { id: 100, playerId: 5, name: 'Mario', surname: 'Rossi', playerRole: 'A', transferDate: null, purchasePrice: 42, fantaAverage: 6.756 },
      { id: 101, playerId: 6, name: 'Luca', surname: 'Verdi', playerRole: 'D', transferDate: null, purchasePrice: 10, fantaAverage: 0 },
      { id: 102, playerId: 7, name: 'Paolo', surname: 'Bianchi', playerRole: 'P', transferDate: null, purchasePrice: 5, fantaAverage: null },
      { id: 103, playerId: 8, name: 'Ex', surname: 'Giocatore', playerRole: 'C', transferDate: '2026-09-01', purchasePrice: 20, fantaAverage: 8 },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const rows = page.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(Array.from(rows, row => row.querySelectorAll('td')[2].textContent?.trim()))
      .toEqual(['6.76', '0.00', '—']);
    expect(page.textContent).toContain('Fantamedia');
    expect(rows[0].textContent).toContain('Attaccante');
    expect(rows[0].querySelectorAll('td')[3].textContent).toBe('42');
    expect(page.textContent).not.toContain('Ex Giocatore');
    expect(page.querySelector('app-player-release')).toBeNull();
    http.verify();
  });

  it('permette di riprovare dopo un errore della rosa', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 12);
    fixture.detectChanges();
    http.expectOne('/api/teams/12/players').flush({}, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')).not.toBeNull();
    page.querySelector<HTMLButtonElement>('button')!.click();
    TestBed.tick();
    http.expectOne('/api/teams/12/players').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Non ci sono calciatori attivi');
    expect(page.querySelector('[role="alert"]')).toBeNull();
    http.verify();
  });

  it('gestisce il divieto di accesso alla rosa', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 13);
    fixture.detectChanges();
    http.expectOne('/api/teams/13/players').flush({}, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Non hai il permesso');
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
    http.verify();
  });
});
