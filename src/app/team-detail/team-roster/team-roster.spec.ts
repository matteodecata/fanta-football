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
    http.expectOne('/api/players?page=0&size=100').flush({ content: [{ id: 5, role: 'A' }], totalPages: 1, totalElements: 1, number: 0 });
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

  it('mostra la rosa mentre carica i ruoli e trova quelli nelle pagine successive', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 12);
    fixture.detectChanges();
    http.expectOne('/api/teams/12/players').flush([
      { id: 100, playerId: 5, name: 'Mario', surname: 'Rossi', transferDate: null, purchasePrice: 42 },
    ]);
    http.expectOne('/api/players?page=0&size=100').flush({
      content: [{ id: 1, role: 'P' }], totalPages: 2, totalElements: 2, number: 0,
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mario');
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Caricamento rosa');
    });
    http.expectOne('/api/players?page=1&size=100').flush({
      content: [{ id: 5, role: 'A' }], totalPages: 2, totalElements: 2, number: 1,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Attaccante');
    http.verify();
  });

  it('mantiene visibile la rosa se il catalogo fallisce e permette di riprovare', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 12);
    fixture.detectChanges();
    http.expectOne('/api/teams/12/players').flush([
      { id: 100, playerId: 5, name: 'Mario', surname: 'Rossi', transferDate: null, purchasePrice: 42 },
    ]);
    http.expectOne('/api/players?page=0&size=100').flush({}, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Mario');
    expect(page.textContent).toContain('Non è stato possibile caricare i ruoli');
    page.querySelector<HTMLButtonElement>('button')!.click();
    TestBed.tick();
    http.expectOne('/api/players?page=0&size=100').flush({
      content: [{ id: 5, role: 'A' }], totalPages: 1, totalElements: 1, number: 0,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Attaccante');
    expect(page.textContent).not.toContain('Non è stato possibile caricare i ruoli');
    http.verify();
  });

  it('gestisce il divieto di accesso alla rosa', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TeamRoster);
    fixture.componentRef.setInput('teamId', 13);
    fixture.detectChanges();
    http.expectOne('/api/teams/13/players').flush({}, { status: 403, statusText: 'Forbidden' });
    http.expectOne('/api/players?page=0&size=100').flush({ content: [], totalPages: 0, totalElements: 0, number: 0 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Non hai il permesso');
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
    http.verify();
  });
});
