import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Players } from './players';
import { PageResponse, PlayerResponse } from './players.model';

//Il describe rinomina il nostro test per fare capire cosa stiamo controllando
describe('Catalogo con filtri e paginazione backend', () => {
  let fixture: ComponentFixture<Players>;
  let component: Players;
  let http: HttpTestingController;
  let element: HTMLElement;
  const goalkeeper: PlayerResponse = {
    id: 1, externalId: 1, name: 'Mario', surname: 'Rossi', role: 'P',
    realTeamName: 'Inter', realTeamShirtNum: 1, price: 5, injured: false,
  };
  const defender: PlayerResponse = {
    ...goalkeeper, id: 2, role: 'D', surname: 'Bianchi', realTeamName: 'Milan', price: 30,
  };

//prima di ogni test prepara un ambiente pulito, per evitare di portarsi qualcosa dal test precedente
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Players],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    //fixture e' l'ambiente che contiene il test
    fixture = TestBed.createComponent(Players);
    //component simula il componente da testare 
    component = fixture.componentInstance;
    //element simula l'html del componente
    element = fixture.nativeElement as HTMLElement;
    //aggiorno la pagina
    fixture.detectChanges();
    //da questa richiesta mi aspetto questo determinato risultato
    http.expectOne('/api/players/real-teams').flush(['Inter', 'Milan', 'Roma']);
    http.expectOne('/api/players/price-range').flush({ minPrice: 5, maxPrice: 30 });
  });

  afterEach(() => {
    try { http.verify(); } finally { TestBed.resetTestingModule(); }
  });

  function request() {
    return http.expectOne(req => req.url === '/api/players');
  }

  function page(content: PlayerResponse[], overrides: Partial<PageResponse> = {}): PageResponse {
    return {
      content, page: 0, size: 20, totalElements: content.length,
      totalPages: content.length ? 1 : 0, hasNext: false, ...overrides,
    };
  }

  async function settle() {
    for (const range of http.match(req => req.url === '/api/players/price-range')) {
      for (const excluded of ['page', 'size', 'minPrice', 'maxPrice']) {
        expect(range.request.params.has(excluded)).toBe(false);
      }
      range.flush({ minPrice: 5, maxPrice: 30 });
    }
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function load() {
    request().flush(page([goalkeeper, defender], { totalPages: 4, totalElements: 80, hasNext: true }));
    await settle();
  }

  it('carica pagina 0 senza filtri e conserva ordine e totali del backend', async () => {
    const initial = request();
    expect(initial.request.params.keys().sort()).toEqual(['page', 'size']);
    expect(initial.request.params.get('page')).toBe('0');
    expect(initial.request.params.get('size')).toBe('20');
    initial.flush(page([goalkeeper, defender], { totalPages: 4, totalElements: 80, hasNext: true }));
    await settle();
    expect(component.pagePlayers()).toEqual([goalkeeper, defender]);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.querySelector('nav')?.textContent).toContain('Pagina 1 di 4');
    expect(component.isPreviousDisabled()).toBe(true);
  });

  it('invia parametri ripetuti, search normalizzata, prezzo zero e injured false', async () => {
    //carico i dati mock in maniera asincrona
    await load();
    //aggiorno i filtri sul componente di test
    component.updateRoleFilter('P');
    component.updateRoleFilter('D');
    component.updateRealTeamNameFilter('Inter');
    component.updateRealTeamNameFilter('Milan');
    component.updateSearchTerm(' ROSSI ');
    component.updateInjuredFilter(false);
    component.updateMinPriceFilter('0');
    component.updateMaxPriceFilter('30');
    //consente ad angular di vedere i cambiamenti
    fixture.detectChanges();
    //request recupera l'endpoint dal backend
    const filtered = request();
    const params = filtered.request.params;
    //
    expect(params.getAll('role')).toEqual(['P', 'D']);
    expect(params.getAll('realTeamName')).toEqual(['Inter', 'Milan']);
    expect(params.get('search')).toBe('ROSSI');
    expect(params.get('minPrice')).toBe('0');
    expect(params.get('maxPrice')).toBe('30');
    expect(params.get('injured')).toBe('false');
    const range = http.expectOne(req => req.url === '/api/players/price-range');
    expect(range.request.params.keys().sort()).toEqual(['injured', 'realTeamName', 'role', 'search']);
    expect(range.request.params.getAll('role')).toEqual(['P', 'D']);
    expect(range.request.params.getAll('realTeamName')).toEqual(['Inter', 'Milan']);
    expect(range.request.params.get('injured')).toBe('false');
    expect(range.request.params.get('search')).toBe('ROSSI');
    range.flush({ minPrice: 0, maxPrice: 30 });
    filtered.flush(page([goalkeeper]));
    await settle();
    component.updateInjuredFilter(false);
    expect(component.minPriceFilter()).toBeNull();
    expect(component.maxPriceFilter()).toBeNull();
    fixture.detectChanges();
    const allStatuses = request();
    expect(allStatuses.request.params.has('injured')).toBe(false);
    allStatuses.flush(page([goalkeeper]));
    await settle();
  });

  it('torna a pagina 0 cambiando filtro e non mantiene le quattro pagine precedenti', async () => {
    await load();
    component.nextPage();
    component.nextPage();
    fixture.detectChanges();
    const second = request();
    expect(second.request.params.get('page')).toBe('1');
    second.flush(page([defender], { page: 1, totalPages: 4, totalElements: 80, hasNext: true }));
    await settle();
    component.updateRoleFilter('D');
    fixture.detectChanges();
    const filtered = request();
    expect(filtered.request.params.get('page')).toBe('0');
    expect(filtered.request.params.getAll('role')).toEqual(['D']);
    filtered.flush(page([defender]));
    await settle();
    expect(element.querySelector('nav')?.textContent).toContain('Pagina 1 di 1');
    expect(component.isNextDisabled()).toBe(true);
    component.nextPage();
    component.previousPage();
    fixture.detectChanges();
    http.expectNone(req => req.url === '/api/players');
  });

  it('mostra suggerimenti cercati dal backend anche se assenti dalla pagina iniziale', async () => {
    await load();
    const search = element.querySelector<HTMLInputElement>('#players-search')!;
    search.value = 'verdi';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelector('.players-suggestion')).toBeNull();
    const filtered = request();
    expect(filtered.request.params.get('search')).toBe('verdi');
    const remotePlayer = { ...defender, id: 42, surname: 'Verdi' };
    filtered.flush(page([remotePlayer]));
    await settle();
    expect(element.querySelector('.players-suggestion')?.textContent).toContain('Mario Verdi');
    element.querySelector<HTMLButtonElement>('.players-suggestion')!.click();
    fixture.detectChanges();
    const selected = request();
    expect(selected.request.params.get('search')).toBe('Mario Verdi');
    expect(selected.request.params.get('page')).toBe('0');
    selected.flush(page([remotePlayer]));
    await settle();
  });

  it('mostra tutte le squadre anche se assenti dalla pagina e con risultati vuoti', async () => {
    await load();
    component.updateRealTeamNameFilter('Inter');
    fixture.detectChanges();
    expect(component.realTeamNames()).toEqual(['Inter', 'Milan', 'Roma']);
    expect(component.disableSlider()).toBe(true);
    request().flush(page([]));
    await settle();
    expect(component.realTeamNames()).toEqual(['Inter', 'Milan', 'Roma']);
    expect(component.maxCatalogPrice()).toBe(30);
    expect(element.querySelector('.empty-state')).not.toBeNull();
    expect(element.querySelector('nav')).toBeNull();
    component.resetFilters();
    fixture.detectChanges();
    const reset = request();
    expect(reset.request.params.keys().sort()).toEqual(['page', 'size']);
    expect(reset.request.params.get('page')).toBe('0');
    reset.flush(page([goalkeeper, defender]));
    await settle();
  });

  it.each([
    { minPrice: null, maxPrice: null, visible: false, disabled: true },
    { minPrice: 30, maxPrice: 30, visible: true, disabled: true },
    { minPrice: 5, maxPrice: 30, visible: true, disabled: false },
  ])('gestisce gli estremi $minPrice e $maxPrice', async ({ minPrice, maxPrice, visible, disabled }) => {
    await load();
    component.priceRangeResource.reload();
    fixture.detectChanges();
    expect(component.hasPriceRange()).toBe(false);
    expect(component.disableSlider()).toBe(true);
    expect(component.sliderPrices()).toEqual({ lower: 0, upper: 0, min: 0, max: 0 });
    http.expectOne('/api/players/price-range').flush({ minPrice, maxPrice });
    await settle();
    expect(component.hasPriceRange()).toBe(visible);
    for (const slider of element.querySelectorAll<HTMLInputElement>('input[type="range"]')) {
      expect(slider.disabled).toBe(disabled);
      expect(Number(slider.min)).toBeLessThanOrEqual(Number(slider.value));
      expect(Number(slider.value)).toBeLessThanOrEqual(Number(slider.max));
    }
    const summary = element.querySelector('.players-price-filter__summary')?.textContent;
    expect(summary).toContain(visible ? 'Prezzo:' : 'Intervallo prezzi non disponibile');
    if (minPrice === maxPrice && visible) expect(summary).toContain('30');
  });

  it.each([0, 1])('aggiorna tutte le risorse dalla pagina %i senza duplicare richieste', async (pageIndex) => {
    await load();
    if (pageIndex === 1) {
      component.nextPage();
      fixture.detectChanges();
      request().flush(page([defender], { page: 1, totalPages: 4, hasNext: true }));
      http.expectNone(req => req.url !== '/api/players');
      await settle();
    }
    element.querySelector<HTMLButtonElement>('header button')!.click();
    fixture.detectChanges();
    const players = request();
    expect(players.request.params.get('page')).toBe('0');
    players.flush(page([goalkeeper]));
    http.expectOne('/api/players/real-teams').flush(['Roma']);
    http.expectOne('/api/players/price-range').flush({ minPrice: 5, maxPrice: 5 });
    await settle();
    expect(component.realTeamNames()).toEqual(['Roma']);
    expect(component.currentPage()).toBe(0);
    expect(component.anyResourceIsLoading()).toBe(false);
  });

  it('consente di restringere e riallargare il prezzo senza ricaricare i limiti', async () => {
    await load();
    for (const price of ['20', '5']) {
      component.updateMinPriceFilter(price);
      fixture.detectChanges();
      const filtered = request();
      expect(filtered.request.params.get('minPrice')).toBe(price);
      http.expectNone(req => req.url !== '/api/players');
      filtered.flush(page([goalkeeper]));
      await settle();
      expect(component.sliderPrices().lower).toBe(5);
      expect(component.sliderPrices().upper).toBe(30);
      expect(component.sliderPrices().min).toBe(Number(price));
    }
  });

  it.each(['real-teams', 'price-range'])('gestisce errore e riprova per %s', async (endpoint) => {
    await load();
    const resource = endpoint === 'real-teams' ? component.realTeamsResource : component.priceRangeResource;
    resource.reload();
    fixture.detectChanges();
    http.expectOne(`/api/players/${endpoint}`).flush('Errore', { status: 500, statusText: 'Server Error' });
    await settle();
    expect(element.querySelector('header [role="alert"]')).not.toBeNull();
    expect(element.querySelector<HTMLButtonElement>('header button')!.disabled).toBe(false);
    if (endpoint === 'price-range') {
      expect(component.hasPriceRange()).toBe(false);
      expect(component.disableSlider()).toBe(true);
    }
    component.refreshCatalog();
    fixture.detectChanges();
    request().flush(page([goalkeeper]));
    http.expectOne('/api/players/real-teams').flush(['Inter']);
    http.expectOne('/api/players/price-range').flush({ minPrice: 5, maxPrice: 30 });
    await settle();
    expect(element.querySelector('header [role="alert"]')).toBeNull();
  });

  it('mostra i giocatori nello stesso ordine ricevuto dal backend', async () => {
    const midfielder = { ...defender, id: 3, role: 'C' as const };
    const attacker = { ...defender, id: 4, role: 'A' as const };
    const mixed = [attacker, defender, midfielder, goalkeeper];
    request().flush(page(mixed));
    await settle();
    expect(component.pagePlayers()).toEqual(mixed);
    expect(component.displayedPlayers()).toEqual(mixed);
    const roles = [...element.querySelectorAll('tbody .players-role-badge')]
      .map(badge => badge.textContent?.trim());
    expect(roles).toEqual(['A', 'D', 'C', 'P']);
  });

  it('non ricarica durante il trascinamento e mantiene tabella e limiti stabili', async () => {
    await load();
    const min = element.querySelector<HTMLInputElement>('#players-min-price-filter')!;
    const max = element.querySelector<HTMLInputElement>('#players-max-price-filter')!;
    const table = element.querySelector('table');
    for (const value of ['10', '20', '15']) {
      min.value = value;
      min.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      http.expectNone(req => req.url.startsWith('/api/players'));
      expect(element.querySelector('table')).toBe(table);
      expect(min.min).toBe('5');
      expect(min.max).toBe('30');
      expect(max.min).toBe('5');
      expect(max.max).toBe('30');
      expect(min.value).toBe(value);
    }
    min.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    const filtered = request();
    expect(filtered.request.params.get('minPrice')).toBe('15');
    expect(element.querySelector('table')).toBe(table);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    filtered.flush(page([defender]));
    await settle();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('gestisce errori senza leggere una resource priva di valore', async () => {
    request().flush('Errore', { status: 500, statusText: 'Server Error' });
    await settle();
    expect(element.querySelector('.alert--danger')).not.toBeNull();
    expect(element.querySelector('.empty-state')).toBeNull();
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('nav')).toBeNull();
    expect(component.isPreviousDisabled()).toBe(true);
    expect(component.isNextDisabled()).toBe(true);
    expect(component.suggestedPlayers()).toEqual([]);
  });
});

