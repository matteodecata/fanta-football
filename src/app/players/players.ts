import { Component, computed, inject, signal } from '@angular/core';
import { PlayerFilters, PlayerResponse, PlayerRole } from './players-response';
import { PlayersService } from './players.service';

@Component({
  selector: 'app-players',
  imports: [],
  templateUrl: './players.html',
  styleUrl: './players.css',
})

export class Players {
  private playersService = inject(PlayersService);

  selectedRoles = signal<PlayerRole[]>([]);
  selectedRealTeamNames = signal<string[]>([]);
  minPriceFilter = signal<number | null>(null);
  maxPriceFilter = signal<number | null>(null);
  injuredFilter = signal<boolean | null>(null);
  searchTerm = signal('');

  // TODO: aggiungi uno stato per capire se almeno un filtro e attivo.
  // Domanda guida: quando mostreresti un bottone "Reset filtri"?
  // Hint: controlla searchTerm, selectedRoles, selectedRealTeamNames, minPriceFilter,
  // maxPriceFilter e injuredFilter. Non serve salvare un nuovo signal se puoi derivarlo.
  
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
  

  // TODO: decidi quali filtri devono davvero chiamare il backend.
  // Domanda guida: se selezioni P e D insieme, il backend supporta role=P&role=D oppure no?
  // Hint: per ora role/realTeamName singoli vanno in currentFilters(), le selezioni multiple
  // vengono rifiltrate qui in visiblePlayers senza inventare un contratto API nuovo.
  playersResource = 
      this.playersService.getPlayersResource(() => this.currentFilters());

  visiblePlayers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const selectedRoles = this.selectedRoles();
    const selectedRealTeamNames = this.selectedRealTeamNames();
    const players = this.playersResource.value();
    return players.filter((player) => {
      const fullName = `${player.name} ${player.surname}`.toLowerCase();
      const matchesTerm = !term || fullName.includes(term);
      const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(player.role);
      const matchesRealTeam =
        selectedRealTeamNames.length === 0 ||
        selectedRealTeamNames.includes(player.realTeamName);
        return matchesTerm && matchesRole && matchesRealTeam;
    });
  });

  // TODO: valuta se anche il prezzo deve filtrare localmente in visiblePlayers.
  // Domanda guida: se minPrice/maxPrice vanno al backend, cosa succede alla lista delle squadre
  // reali quando il catalogo torna gia ristretto dal backend?
  // Hint: confronta il comportamento desiderato con quello dei filtri multi-ruolo e multi-squadra.

  realTeamNames = computed(() => {
    const names = this.playersResource.value().map((player) => player.realTeamName);
    return [...new Set(names)].sort((first, second) => first.localeCompare(second));
  });

  // TODO: valuta se ricavare le squadre da tutti i player caricati o solo dai player visibili.
  // Domanda guida: dopo aver selezionato un ruolo, vuoi vedere tutte le squadre o solo quelle
  // che hanno almeno un calciatore visibile?
  // Hint: playersResource.value() produce opzioni piu stabili; visiblePlayers() produce opzioni
  // piu contestuali ma puo far sparire bottoni mentre filtri.

  suggestedPlayers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (term.length < 2) {
      return [];
    }

    return this.visiblePlayers().slice(0, 5);
  });

   // TODO: semplifica questo computed.
   // Domanda guida: ti serve davvero map + reduce o puoi leggere i prezzi e tornare subito il minimo?
   // Hint: quando playersResource.value() e vuoto deve tornare un number, non null, perche lo slider
   // usa [min], [max] e [value].
   minCatalogPrice =computed(() => {
    const prices = this.playersResource.value();
    if(this.playersResource.value() === null){
      return 0;
    }
    return Math.min(...prices.map((player) => player.price));
   });

   // TODO: tienilo simmetrico a minCatalogPrice.
   // Domanda guida: i due computed si leggono come una coppia?
   // Hint: se cambi logica nel minimo, probabilmente devi fare lo stesso anche qui.
   maxCatalogPrice = computed(() => {
    const prices = this.playersResource.value().map((player) => player.price)
    .reduce((max,price)=> max === null || price > max ? price : max, null as number | null);
    if(prices=== null){
      return 0;
    }
     return prices;
   });
   

     
  currentFilters() : PlayerFilters {
    return {
      role: this.selectedRoles().length === 1 ? this.selectedRoles()[0] : null,
      realTeamName:
        this.selectedRealTeamNames().length === 1 ? this.selectedRealTeamNames()[0] : '',
      minPrice: this.minPriceFilter(),
      maxPrice: this.maxPriceFilter(),
      injured: this.injuredFilter(),
    };
  }

  // TODO: aggiungi gestione messaggi errore piu specifica.
  // Domanda guida: playersResource.error() contiene informazioni utili oltre al semplice "errore"?
  // Hint: prima guarda con console/log o debug che forma ha l'errore HTTP, poi decidi se mostrare
  // un messaggio diverso per 401, 403, 404 o backend spento.


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

  // TODO: collega resetFilters() a un bottone nel template.
  // Domanda guida: dopo il reset serve chiamare playersResource.reload() oppure la resource
  // si aggiorna gia perche currentFilters() legge signal che sono appena cambiati?
  // Hint: prova prima senza reload e guarda se parte una nuova richiesta quando cambi i signal.
  resetFilters() { 
    this.searchTerm.set('');
    this.selectedRoles.set([]);
    this.selectedRealTeamNames.set([]);
    this.minPriceFilter.set(null);
    this.maxPriceFilter.set(null);
    this.injuredFilter.set(null);
  }

  // TODO: prepara il prossimo pezzo della fase 5: asta admin.
  // Domanda guida: questa pagina deve solo mostrare il catalogo o deve anche aprire un flusso
  // per acquistare un calciatore?
  // Hint: per l'asta servono almeno leagueId, teamId, playerId e purchasePrice. Se non hai
  // leagueId/teamId in questa pagina, forse il flusso deve partire dal dettaglio lega o squadra.

  // TODO: prepara il fantavoto senza implementarlo subito.
  // Domanda guida: da dove arriva il matchdayId necessario a /players/{playerId}/matchdays/{matchdayId}/rating?
  // Hint: nel PROJECT_CONTEXT questo punto e indicato come da verificare lato backend; evita una UI
  // che promette una consultazione se non sai ancora dove prendere la giornata.

  selectSuggestedPlayer(player: PlayerResponse) {
    this.searchTerm.set(`${player.name} ${player.surname}`);
  }

  isRoleSelected(role: PlayerRole) {
    return this.selectedRoles().includes(role);
  }

  isRealTeamNameSelected(realTeamName: string) {
    return this.selectedRealTeamNames().includes(realTeamName);
  }


  


}
