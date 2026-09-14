import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuctionPurchaseRequest, AvailablePlayersPageResponse } from './auction.model';
import { EMPTY, expand, Observable, reduce } from 'rxjs';
import { PlayerResponse } from '../players/players.model';



@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly http = inject(HttpClient);

  getAvailablePlayers(leagueId: number): Observable<PlayerResponse[]> {
    const url = `/api/leagues/${leagueId}/players/available`;
    return this.http.get<AvailablePlayersPageResponse>(url).pipe(
      expand(page => page.hasNext
        ? this.http.get<AvailablePlayersPageResponse>(url, {
            params: { page: page.page + 1, size: page.size },
          })
        : EMPTY),
      reduce((players, page) => [...players, ...page.content], [] as PlayerResponse[]),
    );
  }

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
