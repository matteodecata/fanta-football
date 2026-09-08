import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { InviteLeagueResponse } from '../league-detail.models';

@Service()
export class InviteLeagueService {
  private readonly http = inject(HttpClient);

  invite(leagueId: number, invitedUsername: string) {
    return this.http.post<InviteLeagueResponse>(`/api/leagues/${leagueId}/invites`, {
      invitedUsername,
    });
  }
}
