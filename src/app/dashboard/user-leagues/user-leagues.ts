import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  UserLeagueRole,
  UserLeaguesService,
  UserLeagueStatus,
} from './user-leagues.service';

@Component({
  selector: 'app-user-leagues',
  imports: [RouterLink],
  templateUrl: './user-leagues.html',
  styleUrl: './user-leagues.css',
})
export class UserLeagues {
  private readonly userLeaguesService = inject(UserLeaguesService);

  protected readonly leagues = this.userLeaguesService.userLeagues;

  protected reloadLeagues(): void {
    this.leagues.reload();
  }

  protected getRoleLabel(role: UserLeagueRole): string {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'participant':
        return 'Partecipante';
    }
  }

  protected getStatusLabel(status: UserLeagueStatus): string {
    switch (status) {
      case 'draft':
        return 'In preparazione';
      case 'active':
        return 'Attiva';
      case 'completed':
        return 'Conclusa';
    }
  }

  protected getParticipantsLabel(
    participantsCount: number,
    maxParticipants: number,
  ): string {
    return `${participantsCount} partecipanti su ${maxParticipants}`;
  }
}
