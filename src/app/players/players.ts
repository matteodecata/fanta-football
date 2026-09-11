import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { PlayerFilters, PlayerResponse, PlayerRole } from './players.model';
import { PlayersService } from './players.service';

@Component({
  selector: 'app-players',
  imports: [],
  templateUrl: './players.html',
  styleUrl: './players.css',
})
export class Players {
  // PERCORSO: cerca "TODO META" e segui i numeri, un passaggio alla volta.
  // 1: players-response.ts, tipi. 2-3: players.service.ts, chiamate HTTP.
  // 4-6: questo file, collegamento e prezzo selezionato. 7: players.html, stati degli slider.
  // 8: aggiornamento catalogo (HTML). 9: players.spec.ts, verifiche finali.
  private playersService = inject(PlayersService);

  currentPage = signal(0);
  selectedRoles = signal<PlayerRole[]>([]);
  selectedRealTeamNames = signal<string[]>([]);
  minPriceFilter = signal<number | null>(null);
  maxPriceFilter = signal<number | null>(null);
  draftMinPrice = linkedSignal(() => this.minPriceFilter());
  draftMaxPrice = linkedSignal(() => this.maxPriceFilter());
  injuredFilter = signal<boolean | null>(null);
  searchTerm = signal('');

  priceRangeFilters = computed(() => ({
    role: this.selectedRoles(),
    realTeamName: this.selectedRealTeamNames(),
    search: this.searchTerm().trim(),
    injured: this.injuredFilter(),
  }));

  currentFilters = computed<PlayerFilters>(() => ({
    role: this.selectedRoles(),
    realTeamName: this.selectedRealTeamNames(),
    search: this.searchTerm().trim(),
    minPrice: this.minPriceFilter(),
    maxPrice: this.maxPriceFilter(),
    injured: this.injuredFilter(),
  }));

  hasFilterActive = computed(() => {
    const filters = this.currentFilters();
    return filters.search !== '' || filters.realTeamName.length > 0 ||
      filters.role.length > 0 || filters.minPrice !== null ||
      filters.maxPrice !== null || filters.injured !== null;
  });

  playersResource = this.playersService.getPlayersResource(
    () => this.currentPage(),
    () => this.currentFilters(),
  );

  realTeamsResource = this.playersService.getRealTeamsResources();
  priceRangeResource = this.playersService.getPriceRangeResource(
    () => this.priceRangeFilters(),
  );

  // Filtri e paginazione sono gestiti dal backend; conserva l'ordine ricevuto.
  pagePlayers = computed(() => {
    if (this.playersResource.isLoading() || !this.playersResource.hasValue()) return [];
    return this.playersResource.value().content;
  });

  // Mantieni le righe precedenti visibili mentre arriva la risposta successiva.
  displayedPlayers = linkedSignal<{ loading: boolean; players: PlayerResponse[] }, PlayerResponse[]>({
    source: () => ({ loading: this.playersResource.isLoading(), players: this.pagePlayers() }),
    computation: (state, previous) => state.loading ? previous?.value ?? [] : state.players,
  });

  totalPages = computed(() => this.playersResource.hasValue()
    ? this.playersResource.value().totalPages : 0);

  displayedPage = computed(() => this.playersResource.hasValue()
    ? this.playersResource.value().page + 1 : 0);

  realTeamNames = computed(() => this.realTeamsResource.hasValue()
    ? [...this.realTeamsResource.value()].sort((first, second) => first.localeCompare(second))
    : []);

  minCatalogPrice = computed(() => this.priceRangeResource.hasValue()
    ? this.priceRangeResource.value().minPrice : null);
  maxCatalogPrice = computed(() => this.priceRangeResource.hasValue()
    ? this.priceRangeResource.value().maxPrice : null);

  suggestedPlayers = computed(() => this.searchTerm().trim().length < 2
    ? [] : this.pagePlayers().slice(0, 5));

  private isPagePending = computed(() => this.playersResource.isLoading() ||
    !this.playersResource.hasValue() ||
    this.playersResource.value().page !== this.currentPage());

  isPreviousDisabled = computed(() => this.isPagePending() ||
    this.totalPages() === 0 || this.currentPage() <= 0);

  isNextDisabled = computed(() => this.isPagePending() ||
    this.totalPages() === 0 || this.currentPage() >= this.totalPages() - 1 ||
    !this.playersResource.value().hasNext);

  

  previousPage() {
    if (!this.isPreviousDisabled()) this.currentPage.update(page => page - 1);
  }

  nextPage() {
    if (!this.isNextDisabled()) this.currentPage.update(page => page + 1);
  }

  // TODO META 6 - Gestisci un prezzo selezionato prima di cambiare gli altri filtri.
  // Esempio: avevi scelto minimo 50, ma la nuova squadra ha prezzi da 5 a 30. Cosa mostra lo slider?
  // Per iniziare: azzera a null i due filtri prezzo quando cambi squadra, ruolo, ricerca o infortunio.
  // Hint: puoi raccogliere questo piccolo reset in un metodo richiamato dai quattro handler.
  // NON farlo nei due handler del prezzo o cambiando pagina. Mantieni il ritorno a pagina 0.
  // selectSuggestedPlayer passa gia da updateSearchTerm: deve seguire la stessa regola.
  private resetPriceFilter() {
    this.minPriceFilter.set(null);
    this.maxPriceFilter.set(null);
    this.draftMinPrice.set(null);
    this.draftMaxPrice.set(null);
  }
  updateRealTeamNameFilter(value: string) {
    this.currentPage.set(0);
    this.resetPriceFilter();
    this.selectedRealTeamNames.update(names => names.includes(value)
      ? names.filter(name => name !== value) : [...names, value]);
  }

  updateRoleFilter(value: PlayerRole) {
    this.currentPage.set(0);
    this.resetPriceFilter();
    this.selectedRoles.update(roles => roles.includes(value)
      ? roles.filter(role => role !== value) : [...roles, value]);
  }

  updateMinPriceFilter(value: string) {
    this.currentPage.set(0);
    const minPrice = value ? Number(value) : null;
    const maxPrice = this.maxPriceFilter();
    this.minPriceFilter.set(minPrice);
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      this.maxPriceFilter.set(minPrice);
    }
  }

  previewMinPrice(value: string) {
    const min = Number(value);
    this.draftMinPrice.set(min);
    if (min > (this.draftMaxPrice() ?? this.maxCatalogPrice() ?? min)) {
      this.draftMaxPrice.set(min);
    }
  }

  previewMaxPrice(value: string) {
    const max = Number(value);
    this.draftMaxPrice.set(max);
    if (max < (this.draftMinPrice() ?? this.minCatalogPrice() ?? max)) {
      this.draftMinPrice.set(max);
    }
  }

  commitPriceFilters() {
    const min = this.draftMinPrice();
    const max = this.draftMaxPrice();
    this.currentPage.set(0);
    this.minPriceFilter.set(min);
    this.maxPriceFilter.set(max);
  }

  updateMaxPriceFilter(value: string) {
    this.currentPage.set(0);
    const maxPrice = value ? Number(value) : null;
    const minPrice = this.minPriceFilter();
    this.maxPriceFilter.set(maxPrice);
    if (maxPrice !== null && minPrice !== null && maxPrice < minPrice) {
      this.minPriceFilter.set(maxPrice);
    }
  }

  updateInjuredFilter(value: boolean) {
    this.currentPage.set(0);
    this.resetPriceFilter();
    this.injuredFilter.set(this.injuredFilter() === value ? null : value);
  }

  updateSearchTerm(value: string) {
    this.currentPage.set(0);
    this.resetPriceFilter();
    this.searchTerm.set(value);
  }

  resetFilters() {
    this.currentPage.set(0);
    this.searchTerm.set('');
    this.selectedRoles.set([]);
    this.selectedRealTeamNames.set([]);
    this.minPriceFilter.set(null);
    this.maxPriceFilter.set(null);
    this.draftMinPrice.set(null);
    this.draftMaxPrice.set(null);
    this.injuredFilter.set(null);
  }

  selectSuggestedPlayer(player: PlayerResponse) {
    this.updateSearchTerm(`${player.name} ${player.surname}`);
  }

  isRoleSelected(role: PlayerRole) {
    return this.selectedRoles().includes(role);
  }

  isRealTeamNameSelected(realTeamName: string) {
    return this.selectedRealTeamNames().includes(realTeamName);
  }

  teamInitials(realTeamName: string) {
    return realTeamName.split(' ').filter(word => word.length > 0)
      .slice(0, 2).map(word => word[0].toUpperCase()).join('');
  }

  roleBadgeClass(role: PlayerRole) {
    return `badge players-role-badge players-role-badge--${role.toLowerCase()}`;
  }

  disableSlider = computed<boolean>(() => {
    // Prima verifica che la risposta sia disponibile e leggibile.
    if (this.priceRangeResource.isLoading() || this.priceRangeResource.error() ||
        !this.priceRangeResource.hasValue()) {
      return true;
    }
    const response = this.priceRangeResource.value();
    // Una risposta presente puo comunque contenere estremi null.
    if (response.maxPrice === null || response.minPrice === null) {
      return true;
    }
    // Lo scorrimento serve solo quando esiste un intervallo di prezzi.
    return response.minPrice >= response.maxPrice;
  });

  refreshCatalog() {
    const currentPage = this.currentPage();
    if(currentPage !== 0) {
      this.currentPage.set(0);
    }else {
      this.playersResource.reload();
    }
    this.priceRangeResource.reload();
    this.realTeamsResource.reload();
  }
  
 

  hasPriceRange = computed<boolean>(() => {  
    if(this.priceRangeResource.isLoading() || this.priceRangeResource.error() || !this.priceRangeResource.hasValue()) {
      return false;
    }
    const response = this.priceRangeResource.value();
    return response.minPrice !== null && response.maxPrice !== null &&
      response.minPrice <= response.maxPrice;
  });

  // I valori tecnici degli input restano numerici anche senza un intervallo.
  sliderPrices = computed(() => {
    if (!this.hasPriceRange()) return { lower: 0, upper: 0, min: 0, max: 0 };
    const lower = this.minCatalogPrice() ?? 0;
    const upper = this.maxCatalogPrice() ?? lower;
    const min = Math.min(upper, Math.max(lower, this.draftMinPrice() ?? lower));
    const max = Math.max(min, Math.min(upper, Math.max(lower, this.draftMaxPrice() ?? upper)));
    return { lower, upper, min, max };
  });
  
  anyResourceIsLoading = computed(() => {
    return  this.playersResource.isLoading() || this.realTeamsResource.isLoading() || this.priceRangeResource.isLoading();
  });
}
