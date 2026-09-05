import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type InviteDecision = Extract<InviteStatus, 'ACCEPTED' | 'DECLINED'>;

export interface InviteResponse {
  id: number;
  leagueId: number;
  invitedByUserId: number;
  invitedUserId: number;
  status: InviteStatus;
  sentDate: string;
  responseDate: string | null;
}

interface UpdateInviteStatusRequest {
  status: InviteDecision;
}

@Service()
export class PendingInvitesService {
  private readonly http = inject(HttpClient);

  readonly pendingInvites = httpResource<InviteResponse[]>(
    () => '/api/invites/pending',
    { defaultValue: [] },
  );

  respondToInvite(
    inviteId: number,
    status: InviteDecision,
  ): Observable<InviteResponse> {
    const request: UpdateInviteStatusRequest = { status };
    return this.http.patch<InviteResponse>(`/api/invites/${inviteId}`, request);
  }
}
