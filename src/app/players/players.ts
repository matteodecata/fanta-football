import { Component, computed, inject, signal } from '@angular/core';
import { PlayerResponse, PlayerRole } from './players-response';
import { PlayersService } from './players.service';

@Component({
  selector: 'app-players',
  imports: [],
  templateUrl: './players.html',
  styleUrl: './players.css',
})

export class Players {
  private playersService = inject(PlayersService);

  currentPage = signal<number>(0);
  selectedRoles = signal<PlayerRole[]>([]);
  selectedRealTeamNames = signal<string[]>([]);
  minPriceFilter = signal<number | null>(null);
  maxPriceFilter = signal<number | null>(null);
  injuredFilter = signal<boolean | null>(null);
  searchTerm = signal('');

  

  hasFilterActive = computed(() => {
    return (
      this.searchTerm().trim() !== '' ||
      this.selectedRealTeamNames().length > 0 ||
      this.selectedRoles().length > 0 ||
      this.minPriceFilter() !== null ||
      this.maxPriceFilter() !== null ||
      this.injuredFilter() !== null
    );
  });

  playersResource = this.playersService.getPlayersResource(() => this.currentPage());

  // TODO PAG 3: le letture di .content sono corrette; ora gestisci anche una GET fallita.
  // Crea sopra visiblePlayers un computed chiamato pagePlayers: deve restituire PlayerResponse[].
  // Hint: prima controlla playersResource.hasValue(); se manca il valore restituisci [], altrimenti content.
  // Poi usa pagePlayers() in visiblePlayers, realTeamNames, minCatalogPrice e maxCatalogPrice.
  // Prova con il backend spento: deve comparire l'errore senza tentare map/filter su dati mancanti.
  //
   pagePlayers = computed(() => {
    if(!this.playersResource.hasValue()) {
      return [];
    }
    return this.playersResource.value().content;
  })

  totalPages = computed(() => {
    if(!this.playersResource.hasValue()) {
      return 0;
    }
    return this.playersResource.value().totalPages;
  });
   // TODO PAG 6, dopo i pulsanti: fai cercare e filtrare TUTTO il catalogo al backend.
  // Ora questo filter vede solo i 20 ricevuti. Prima prova la ricerca per nome usando il parametro reale dell'API.
  // Poi aggiungi ruolo, squadra, prezzo e infortunio; verifica come inviare piu ruoli/squadre insieme.
  // Quando il backend applica un filtro, evita di rifarlo qui con regole diverse.
  // Prova un cognome che non era nella pagina corrente. Se l'API non supporta il filtro, va completata prima.
  visiblePlayers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const selectedRoles = this.selectedRoles();
    const selectedRealTeamNames = this.selectedRealTeamNames();
    const minPrice = this.minPriceFilter();
    const maxPrice = this.maxPriceFilter();
    const players = this.playersResource.value().content;
    const injured = this.injuredFilter();
    return players.filter((player) => {
      const fullName = `${player.name} ${player.surname}`.toLowerCase();
      const matchesTerm = !term || fullName.includes(term);
      const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(player.role);
      const matchesRealTeam =
        selectedRealTeamNames.length === 0 ||
        selectedRealTeamNames.includes(player.realTeamName);
      const matchesMinPrice = minPrice === null || player.price >= minPrice;
      const matchesMaxPrice = maxPrice === null || player.price <= maxPrice;
      const matchesInjured = injured === null || player.injured === injured;
      return matchesTerm && matchesRole && matchesRealTeam && matchesMinPrice && matchesMaxPrice && matchesInjured;
    });
  });

  playersGroupedByRole = computed(() => {
    // PAG 6, ordine: questo sort ordina solo i 20 ricevuti. Per ordinare tutto per P, D, C, A,
    // chiedi l'ordinamento al backend prima della paginazione, con un criterio stabile a parita di ruolo.
    const roleOrder: Record<PlayerRole, number> = {
      P: 0,
      D: 1,
      C: 2,
      A: 3,
    };

    return [...this.visiblePlayers()].sort((firstPlayer, secondPlayer) => {
      return roleOrder[firstPlayer.role] - roleOrder[secondPlayer.role];
    });
  });

  // TODO PAG 8: evita che bottoni squadra e limiti degli slider cambino passando pagina.
  // Esempio: se nei primi 20 manca la Roma, il suo filtro sparisce anche se esiste nel catalogo.
  // Chiedi al backend tutte le squadre e il minimo/massimo del catalogo, separati dalla pagina.
  // Usa quei dati qui e in minCatalogPrice/maxCatalogPrice. Non inventare URL se l'endpoint manca.
  realTeamNames = computed(() => {
    return [...new Set(
      this.playersResource.value().content.map((player) =>
               player.realTeamName))]
                  .sort((first, second) => first.localeCompare(second));
  });


  suggestedPlayers = computed(() => {
    // PAG 6: anche i suggerimenti devono leggere i risultati della ricerca backend.
    // slice(0, 5) qui va bene: limita i suggerimenti, non decide quali giocatori cercare.
    const term = this.searchTerm().trim().toLowerCase();
    if (term.length < 2) {
      return [];
    }
    return this.visiblePlayers().slice(0, 5);
  });

   minCatalogPrice = computed(() => {
    const prices = this.playersResource.value().content.map((player) => player.price);
    if (prices.length === 0) {
      return 0;
    }
    return Math.min(...prices);
   });

   maxCatalogPrice = computed(() => {
    const prices = this.playersResource.value().content.map((player) => player.price);
    if (prices.length === 0) {
      return 0;
    }
     return Math.max(...prices);
   });

   
   


  // TODO: aggiungi gestione messaggi errore piu specifica.
  // Domanda guida: playersResource.error() contiene informazioni utili oltre al semplice "errore"?
  // Hint: prima guarda con console/log o debug che forma ha l'errore HTTP, poi decidi se mostrare
  // un messaggio diverso per 401, 403, 404 o backend spento.

  previousPage()  {
    if(!this.playersResource.hasValue() || this.playersResource.isLoading() 
      || this.playersResource.value().totalPages === 0 || this.playersResource.error()) {
      return;
    }
    const currentPage = this.currentPage();
    if(currentPage > 0) {
      this.currentPage.set(currentPage - 1);
    }
  };

  nextPage(){
    if(!this.playersResource.hasValue() || this.playersResource.isLoading() ||
         this.playersResource.value().totalPages === 0 || this.playersResource.error()) {
      return;
    }
    const totalPages = this.playersResource.value().totalPages;
    const currentPage = this.currentPage();
    if(currentPage < totalPages -1) {
      this.currentPage.set(currentPage + 1);
    }
  };

  isPreviousDisabled = computed(() => {
    return !this.playersResource.hasValue() || this.playersResource.isLoading() 
       || this.totalPages() === 0 || this.currentPage() <= 0
  });

  isNextDisabled = computed(() => {
    return !this.playersResource.hasValue() || this.playersResource.isLoading()
    || this.totalPages() === 0 || this.currentPage() >= this.totalPages() - 1
  });


  // TODO PAG 4: aggiungi qui previousPage() e nextPage(), prima dei metodi dei filtri.
  // Devono diminuire/aumentare currentPage di 1. Dopo PAG 2, la GET parte da sola: niente reload aggiuntivo.
  // Controlla i limiti PRIMA di cambiare il signal, anche dentro i metodi: non basta disabilitare il bottone.
  // Hint: con pagine da 0 e totalPages = 3, gli indici validi sono 0, 1, 2. Con zero pagine non avanzare.
  // Leggi totalPages solo se hasValue() e vero; durante caricamento/errori non cambiare pagina.
  //
  // TODO PAG 7, insieme ai filtri backend: quando cambia un filtro, torna alla prima pagina.
  // Esempio: sei a pagina 5 e cerchi un nome con 2 risultati; devi richiedere la prima, non la quinta.
  // Aggiungi il reset di currentPage ai metodi di filtro sotto, incluso updateSearchTerm e resetFilters.
  // Ricordati anche selectSuggestedPlayer: cambia il testo della ricerca, quindi deve resettare la pagina.
  updateRealTeamNameFilter(value: string) {
    this.selectedRealTeamNames.update((selectedNames) =>
      selectedNames.includes(value)
        ? selectedNames.filter((selectedName) => selectedName !== value)
        : [...selectedNames, value],
    );
  }

  updateRoleFilter(value: PlayerRole) {
    this.selectedRoles.update((selectedRoles) =>
      selectedRoles.includes(value)
        ? selectedRoles.filter((selectedRole) => selectedRole !== value)
        : [...selectedRoles, value],
    );
  }

  updateMinPriceFilter(value: string) {
    const minPrice = value ? Number(value) : null;
    const maxPrice = this.maxPriceFilter();
    this.minPriceFilter.set(minPrice);
    if (minPrice !== null && maxPrice !== null &&  minPrice > maxPrice) {
     this.maxPriceFilter.set(minPrice);
    }
  }

  updateMaxPriceFilter(value: string) {
   const maxPrice = value ? Number(value) : null;
   const minPrice = this.minPriceFilter();
       this.maxPriceFilter.set(maxPrice);
   if (maxPrice !== null && minPrice !== null && maxPrice < minPrice) {
    this.minPriceFilter.set(maxPrice);
   }
  }

  updateInjuredFilter(value: boolean) {
    this.injuredFilter.set(this.injuredFilter() === value ? null : value);
  }

  updateSearchTerm(value: string) {
    this.searchTerm.set(value);
  }

  resetFilters() { 
    this.searchTerm.set('');
    this.selectedRoles.set([]);
    this.selectedRealTeamNames.set([]);
    this.minPriceFilter.set(null);
    this.maxPriceFilter.set(null);
    this.injuredFilter.set(null);
  }


  selectSuggestedPlayer(player: PlayerResponse) {
    // PAG 7: applica anche qui lo stesso reset della pagina usato quando digiti un nome.
    this.searchTerm.set(`${player.name} ${player.surname}`);
  }

  isRoleSelected(role: PlayerRole) {
    return this.selectedRoles().includes(role);
  }

  isRealTeamNameSelected(realTeamName: string) {
    return this.selectedRealTeamNames().includes(realTeamName);
  }

  teamInitials(realTeamName: string) {
    return realTeamName
      .split(' ')
      .filter((word) => word.length > 0)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  }

  roleBadgeClass(role: PlayerRole) {
    return `badge players-role-badge players-role-badge--${role.toLowerCase()}`;
  }


  


}
