import { Component, inject, signal } from '@angular/core';
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

  players = signal<PlayerResponse[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  roleFilter = signal<PlayerRole | ''>('');
  realTeamNameFilter = signal("");
  minPriceFilter = signal<number | null>(null);
  maxPriceFilter = signal<number | null>(null);
  injuredFilter = signal<boolean | null>(false);

  loadPlayers() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.playersService.getPlayers(this.currentFilters()).subscribe({
      next: (players) => {
        this.players.set(players);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('La richiesta non e andata a buon fine.');
        this.loading.set(false);
      },
    });
  }

  currentFilters() : PlayerFilters {
    return {
      role: this.roleFilter(),
      realTeamName: this.realTeamNameFilter(),
      minPrice: this.minPriceFilter(),
      maxPrice: this.maxPriceFilter(),
      injured: this.injuredFilter(),
    };
  }


  updateRealTeamNameFilter(value: string) {
    this.realTeamNameFilter.set(value);
  }

  updateRoleFilter(value: string) {
    this.roleFilter.set(value as PlayerRole | '');
  }

  updateMinPriceFilter(value: string) {
   this.minPriceFilter.set(value ? Number(value) : null);
  }

  updateMaxPriceFilter(value: string) {
  this.maxPriceFilter.set(value ? Number(value) : null);
  }

  updateInjuredFilter(value: boolean) {
    this.injuredFilter.set(value);
  }


  


}
