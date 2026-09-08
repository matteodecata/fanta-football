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

  playersResource = 
      this.playersService.getPlayersResource();

  visiblePlayers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const selectedRoles = this.selectedRoles();
    const selectedRealTeamNames = this.selectedRealTeamNames();
    const minPrice = this.minPriceFilter();
    const maxPrice = this.maxPriceFilter();
    const players = this.playersResource.value();
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

  realTeamNames = computed(() => {
    return [...new Set(
      this.playersResource.value().map((player) =>
               player.realTeamName))]
                  .sort((first, second) => first.localeCompare(second));
  });


  suggestedPlayers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (term.length < 2) {
      return [];
    }
    return this.visiblePlayers().slice(0, 5);
  });

   minCatalogPrice = computed(() => {
    const prices = this.playersResource.value().map((player) => player.price);
    if (prices.length === 0) {
      return 0;
    }
    return Math.min(...prices);
   });

   maxCatalogPrice = computed(() => {
    const prices = this.playersResource.value().map((player) => player.price);
    if (prices.length === 0) {
      return 0;
    }
     return Math.max(...prices);
   });

   
   


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
