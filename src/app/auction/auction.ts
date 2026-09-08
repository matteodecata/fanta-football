import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PlayerResponse } from '../players/players-response';
import { AuctionService } from './auction.service';
import { HttpErrorResponse } from '@angular/common/http';

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

  protected readonly playersResource = httpResource<PlayerResponse[]>(() => ({
    url: '/api/players',
    method: 'GET',
  }), {
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

  protected readonly availablePlayers = computed(() => {
    const selectedPlayerId = this.selectedPlayerId();
    return this.playersResource.value().filter((player) => player.id !== selectedPlayerId);
  });

  // TODO: quando avrai il backend completo, mostra solo i giocatori ancora acquistabili.
  // Domanda guida: come capisci se un calciatore e gia stato preso da una squadra della lega?
  // Hint: puoi chiedere al backend un catalogo gia filtrato, oppure ricevere le rose della lega
  // e creare un computed che esclude gli id gia presenti.

  protected readonly canSubmit = computed(
    () =>
      this.selectedTeamId() !== null &&
      this.selectedPlayer() !== undefined &&
      this.isPriceValid() &&
      !this.isSubmitting()
  );

  protected updateSelectedTeam(value: string) {
    this.selectedTeamId.set(value ? Number(value) : null);
  }

  protected updateSelectedPlayer(value: string) {
    this.selectedPlayerId.set(value ? Number(value) : null);
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
      this.selectedPlayerId.set(null);
      this.purchasePrice.set(null);
      this.teamsResource.reload();
      this.playersResource.reload();
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.submitError.set('Giocatore già acquistato o budget insufficiente.');
        return;
      }
      console.error('Errore durante la registrazione acquisto:', error);
      this.submitError.set('Non e stato possibile registrare l\'acquisto. Riprova.');
    } finally {
      this.isSubmitting.set(false);
      this.selectedTeamId.set(null);
      this.selectedPlayerId.set(null);
      this.purchasePrice.set(null);
    }

    // TODO: dopo una registrazione riuscita, aggiorna i dati visibili.
    // Domanda guida: cosa deve cambiare subito nella pagina dopo l'acquisto?
    // Hint: puoi fare reload delle resource, svuotare i campi selezionati e mostrare un messaggio
    // di successo; cosi l'admin capisce che l'azione e andata a buon fine.

  }
}
