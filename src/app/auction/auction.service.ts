import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuctionPurchaseRequest } from './auction.model';



@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly http = inject(HttpClient);

  registerPurchase(
    leagueId: number,
    teamId: number,
    playerId: number,
    request: AuctionPurchaseRequest,
  ) {
    return this.http.request<void>(
      'POST',
      `/api/leagues/${leagueId}/teams/${teamId}/players/${playerId}`,
      { body: request },
    );
  }
}
