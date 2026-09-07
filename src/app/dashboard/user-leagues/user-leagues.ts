import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InviteLeague } from '../../league-detail/invite-league/invite-league';
import { UserLeaguesService } from './user-leagues.service';

@Component({
  selector: 'app-user-leagues',
  imports: [RouterLink, InviteLeague],
  templateUrl: './user-leagues.html',
  styleUrl: './user-leagues.css',
})
export class UserLeagues {
  private readonly userLeaguesService = inject(UserLeaguesService);

  protected readonly leagues = this.userLeaguesService.userLeagues;
  protected readonly inviteOpen = signal<number | null>(null);

  protected reloadLeagues(): void {
    this.leagues.reload();
  }

  protected toggleInvite(leagueId: number): void {
    this.inviteOpen.set(this.inviteOpen() === leagueId ? null : leagueId);
  }

  protected getRoleLabel(admin: boolean): string {
    return admin ? 'Amministratore' : 'Partecipante';
  }

  protected formatBudget(budget: number): string {
    return new Intl.NumberFormat('it-IT').format(budget);
  }

  protected formatPoints(points: number): string {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(points);
  }
}
