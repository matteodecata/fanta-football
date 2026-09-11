import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PlayerResponse } from '../players/players.model';
import { Auction } from './auction';
import { AvailablePlayersPageResponse } from './auction.model';

describe('Auction player search', () => {
  let fixture: ComponentFixture<Auction>;
  let http: HttpTestingController;
  let page: HTMLElement;
  const teamsUrl = '/api/leagues/7/teams';
  const playersUrl = '/api/leagues/7/players/available';
  const teams = [{ teamId: 12, teamName: 'Squadra Uno', username: 'admin', budget: 100 }];
  const players: PlayerResponse[] = Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    externalId: index + 1,
    name: index === 7 ? 'Alessandro' : 'Mario',
    surname: index === 7 ? 'Bianchi' : `Rossi ${index + 1}`,
    role: 'C',
    realTeamName: 'Roma',
    realTeamShirtNum: index + 1,
    price: 10,
    injured: false,
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auction],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ leagueId: '7' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Auction);
    page = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function element<T extends HTMLElement>(selector: string): T {
    const found = page.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);
    return found;
  }

  async function settle() {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function playersPage(content: PlayerResponse[]): AvailablePlayersPageResponse {
    return {
      content,
      page: 0,
      size: 20,
      totalElements: content.length,
      totalPages: content.length > 0 ? 1 : 0,
      hasNext: false,
    };
  }

  async function load(catalog = players) {
    http.expectOne(teamsUrl).flush(teams);
    http.expectOne(playersUrl).flush(playersPage(catalog));
    await settle();
  }

  function input(selector: string, value: string) {
    const field = element<HTMLInputElement>(selector);
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function preparePurchase() {
    const team = element<HTMLSelectElement>('#auction-team');
    team.value = '12';
    team.dispatchEvent(new Event('change', { bubbles: true }));
    input('#auction-player', 'bianchi');
    element<HTMLButtonElement>('.auction-suggestion').click();
    input('#auction-price', '20');
  }

  it('legge content dalla risposta paginata e cerca per cognome nei giocatori ricevuti', async () => {
    await load();
    input('#auction-player', ' BIANCHI ');
    expect(element('.auction-suggestion').textContent).toContain('Alessandro Bianchi');
    expect(element('.auction-suggestion__meta').textContent).toContain('C - Roma');
    input('#auction-player', 'rossi');
    expect(page.querySelectorAll('.auction-suggestion')).toHaveLength(5);
    http.expectNone(playersUrl);
  });

  it('seleziona il player, ripristina il focus e annulla la scelta se cambia il testo', async () => {
    await load();
    preparePurchase();
    const search = element<HTMLInputElement>('#auction-player');
    expect(search.value).toBe('Alessandro Bianchi');
    expect(document.activeElement).toBe(search);
    expect(page.querySelector('.auction-suggestions')).toBeNull();
    expect(element('.auction-summary').textContent).toContain('80 crediti');
    expect(element<HTMLButtonElement>('.btn--primary').disabled).toBe(false);
    input('#auction-player', 'rossi');
    expect(element<HTMLButtonElement>('.btn--primary').disabled).toBe(true);
    expect(page.querySelector('.auction-summary')).toBeNull();
    expect(page.querySelectorAll('.auction-suggestion')).toHaveLength(5);
  });

  it('mostra nessuna corrispondenza solo dopo una ricerca di almeno due caratteri', async () => {
    await load();
    expect(page.querySelector('.auction-search-status')).toBeNull();
    input('#auction-player', 'z');
    expect(page.querySelector('.auction-search-status')).toBeNull();
    input('#auction-player', 'zz');
    expect(element('.auction-search-status').textContent).toContain('Nessun calciatore corrisponde');
    input('#auction-player', '');
    expect(page.querySelector('.auction-search-status')).toBeNull();
  });

  it('distingue il catalogo vuoto dal caricamento', async () => {
    expect(page.querySelector('.auction-search-status')).toBeNull();
    await load([]);
    expect(element('.auction-search-status').textContent).toContain('Non ci sono calciatori disponibili');
    expect(element<HTMLButtonElement>('.btn--primary').disabled).toBe(true);
  });

  it('mostra gli errori delle resource senza presentare un falso catalogo vuoto', async () => {
    http.expectOne(teamsUrl).flush('Errore', { status: 500, statusText: 'Server Error' });
    http.expectOne(playersUrl).flush('Errore', { status: 500, statusText: 'Server Error' });
    await settle();
    expect(element('.alert--danger').textContent).toContain('Non e stato possibile caricare');
    expect(page.querySelector('.auction-search-status')).toBeNull();
    expect(element<HTMLInputElement>('#auction-player').disabled).toBe(true);
  });

  it('invia il player scelto e ricarica lista e budget dopo il successo', async () => {
    await load();
    preparePurchase();
    element<HTMLButtonElement>('.btn--primary').click();
    fixture.detectChanges();
    expect(element('.auction-summary').textContent).toContain('In corso');
    expect(element<HTMLInputElement>('#auction-player').disabled).toBe(true);
    expect(element<HTMLInputElement>('#auction-price').disabled).toBe(true);
    expect(element<HTMLSelectElement>('#auction-team').disabled).toBe(true);
    const purchase = http.expectOne('/api/leagues/7/teams/12/players/8');
    expect(purchase.request.method).toBe('POST');
    expect(purchase.request.body).toEqual({ purchasePrice: 20 });
    purchase.flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    fixture.detectChanges();
    http.expectOne(teamsUrl).flush([{ ...teams[0], budget: 80 }]);
    http.expectOne(playersUrl).flush(playersPage(players.filter(player => player.id !== 8)));
    await settle();
    expect(element<HTMLInputElement>('#auction-player').value).toBe('');
    expect(element<HTMLInputElement>('#auction-price').value).toBe('');
    expect(element('.alert--success').textContent).toContain('Acquisto registrato');
    input('#auction-player', 'bianchi');
    expect(page.querySelector('.auction-suggestion')).toBeNull();
    expect(element('.auction-search-status').textContent).toContain('Nessun calciatore corrisponde');
  });
});
