import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface PendingInvite {
  id: string;
  leagueId: string;
  leagueName: string;
  invitedBy: string;
  receivedAt: string;
}

@Service()
export class PendingInvitesService {
  private readonly http = inject(HttpClient);

  readonly pendingInvites = httpResource<PendingInvite[]>(
    () => '/api/invites/pending',
    { defaultValue: [] },
  );

  acceptInvite(inviteId: string): Observable<void> {
    return this.http.post<void>(`/api/invites/${inviteId}/accept`, {});
  }

  rejectInvite(inviteId: string): Observable<void> {
    return this.http.post<void>(`/api/invites/${inviteId}/reject`, {});
  }
}
