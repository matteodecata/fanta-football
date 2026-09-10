import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
export type InviteDecision = Extract<InviteStatus, 'ACCEPTED' | 'DECLINED'>;

export interface InviteResponse {
  id: number;
  leagueId: number;
  // Richiedono l'estensione del DTO backend; compatibili con la risposta attuale.
  leagueName?: string;
  username?: string;
  invitedByUsername?: string;
  /** Must be returned by the sent-invites endpoint from invitedUser.username. */
  invitedUsername?: string;
  invitedByUserId: number;
  invitedUserId: number;
  status: InviteStatus;
  sentDate: string;
  responseDate: string | null;
}

interface UpdateInviteStatusRequest {
  status: InviteDecision | 'CANCELLED';
}

@Service()
export class PendingInvitesService {
  private readonly http = inject(HttpClient);
  private readonly sentInvitesEnabled = signal(false);

  readonly pendingInvites = httpResource<InviteResponse[]>(
    () => '/api/invites/pending',
    { defaultValue: [] },
  );

  readonly sentInvites = httpResource<InviteResponse[]>(
    () => this.sentInvitesEnabled() ? '/api/invites/sent' : undefined,
    { defaultValue: [] },
  );

  enableSentInvites(): void {
    this.sentInvitesEnabled.set(true);
  }

  respondToInvite(
    inviteId: number,
    status: InviteDecision | 'CANCELLED',
  ): Observable<InviteResponse> {
    const request: UpdateInviteStatusRequest = { status };
    return this.http.patch<InviteResponse>(`/api/invites/${inviteId}`, request);
  }

  cancelInvite(inviteId: number): Observable<InviteResponse> {
    return this.respondToInvite(inviteId, 'CANCELLED');
  }
}
