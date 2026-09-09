import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PlayerResponse } from '../players/players-response';

export interface AvailablePlayersPageResponse {
  content: PlayerResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AuctionPurchaseRequest {
  purchasePrice: number;
}

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
