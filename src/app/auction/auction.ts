import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { extractApiError } from '../core/http/api-error';
import { PlayerResponse } from '../players/players-response';
import { AuctionService } from './auction.service';

interface AuctionTeam {
  teamId: number;
  teamName: string;
  username: string;
  budget: number;
}

@Component({
  selector: 'app-auction',
  imports: [RouterLink],
  templateUrl: './auction.html',
  styleUrl: './auction.css',
})

export class Auction {
  private readonly route = inject(ActivatedRoute);
  private readonly auctionService = inject(AuctionService);

  protected readonly leagueId = Number(this.route.snapshot.paramMap.get('leagueId'));

  protected readonly selectedTeamId = signal<number | null>(null);
  protected readonly selectedPlayerId = signal<number | null>(null);
  protected readonly searchText = signal<string>('');
  
  protected readonly purchasePrice = signal<number | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly submitSuccess = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);

  protected readonly teamsResource = httpResource<AuctionTeam[]>(() => {
    if (!this.leagueId || Number.isNaN(this.leagueId)) {
      return undefined;
    }

    return {
      url: `/api/leagues/${this.leagueId}/teams`,
      method: 'GET',
    };
  }, {
    defaultValue: [],
  });

  protected readonly playersResource = httpResource<PlayerResponse[]>(() => {
      if (!this.leagueId || Number.isNaN(this.leagueId)) {
      return undefined;
    }
    return {
      url: `/api/leagues/${this.leagueId}/players/available`,
      method: 'GET',
    };
  }, {
    defaultValue: [],
  });

  protected readonly isLoading = computed(
    () => this.teamsResource.isLoading() || this.playersResource.isLoading(),
  );

  protected readonly hasError = computed(
    () => this.teamsResource.error() !== undefined || this.playersResource.error() !== undefined,
  );

  protected readonly selectedTeam = computed(() => {
    return this.teamsResource.value().find((team) => team.teamId === this.selectedTeamId());
  });

  protected readonly isPriceValid = computed(() => {
    const price = this.purchasePrice();
    const team = this.selectedTeam();
    return price !== null && price > 0 && team !== undefined && price <= team.budget;
  });

  protected readonly selectedPlayer = computed(() => {
    const playerId = this.selectedPlayerId();
    return this.playersResource.value().find((player) => player.id === playerId);
  });

  protected readonly remainingBudget = computed(() => {
    const team = this.selectedTeam();
    const price = this.purchasePrice();
    if (team === undefined || price === null) {
      return null;
    }
    return team.budget - price;
  });

  // TODO R2: slice taglia ancora la stringa, anche dopo averlo spostato su toLowerCase().
  // Domanda guida: toLowerCase() restituisce il nome in minuscolo o un array di giocatori?
  // Hint: conserva il nome completo per includes; applica il limite all'array restituito
  // da filter, dopo la chiusura della sua callback. Il nome suggestedPlayers ora va bene.
  // Verifica: "rossi" deve trovare "Mario Rossi" e i risultati devono essere al massimo 5.
  protected readonly suggestedPlayers = computed(()=> {
    const searchText = this.searchText().trim().toLowerCase();
    const players= this.playersResource.value().slice(0,5);
    if (searchText.length < 2) {
      return [];
    }
    return players.filter((player) => {
      const fullname = `${player.name} ${player.surname}`.toLowerCase();
      return fullname.includes(searchText);
    })
  });

  protected readonly canSubmit = computed(
    () =>
      this.isLoading() === false &&
      this.hasError() === false &&
      this.selectedTeam() !== undefined &&
      this.selectedTeamId() !== null &&
      this.selectedPlayer() !== undefined &&
      this.isPriceValid() &&
      !this.isSubmitting()
  );

  protected updateSelectedTeam(value: string) {
    this.selectedTeamId.set(value ? Number(value) : null);
  }

  
  changeSearchTextAndResetId(value: string) {
    this.searchText.set(value);
    this.selectedPlayerId.set(null);
  }


  selectSuggestedPlayer(player: PlayerResponse) {
    this.selectedPlayerId.set(player.id);
    this.searchText.set(`${player.name} ${player.surname}`);   
  }


  protected updatePurchasePrice(value: string) {
    this.purchasePrice.set(value ? Number(value) : null);
  }

  protected async submitAuctionPurchase(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    const teamId = this.selectedTeamId();
    const playerId = this.selectedPlayerId();
    const price = this.purchasePrice();

    if (teamId === null || playerId === null || price === null) {
      return;
    }

    this.isSubmitting.set(true);
    this.submitSuccess.set(null);
    this.submitError.set(null);

    try {
      await firstValueFrom(
        this.auctionService.registerPurchase(
          this.leagueId,
          teamId,
          playerId,
          { purchasePrice: price },
        ),
      );
      this.submitSuccess.set('Acquisto registrato correttamente.');
      this.searchText.set('');
      this.selectedPlayerId.set(null);
      this.selectedTeamId.set(null)
      this.purchasePrice.set(null);
      this.teamsResource.reload();
      this.playersResource.reload();
      
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        const apiError = extractApiError(error);
        if (apiError?.errorCode === 'budget_too_low') {
          this.submitError.set('Budget insufficiente. Controlla il budget aggiornato e modifica il prezzo.');
          this.purchasePrice.set(null);
          this.teamsResource.reload();
          return;
        }

        if (apiError?.errorCode === 'player_already_owned') {
          this.submitError.set('Giocatore gia acquistato nella lega. Seleziona un altro calciatore.');
          this.selectedPlayerId.set(null);
          this.playersResource.reload();
          return;
        }

        const message = apiError?.message.trim() || 'Acquisto non registrato per un conflitto.';
        this.submitError.set(`${message} Verifica il budget e seleziona nuovamente il calciatore.`);
        this.selectedPlayerId.set(null);
        this.teamsResource.reload();
        this.playersResource.reload();
        return;
      }
      console.error('Errore durante la registrazione acquisto: ', error);
      this.submitError.set('Non e stato possibile registrare l\'acquisto. Riprova.');
    } finally {
      this.isSubmitting.set(false);
      
      
    }
  }
}
