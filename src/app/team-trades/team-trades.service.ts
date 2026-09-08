import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from "rxjs";
import { TeamResponse } from '../dashboard/user-leagues/user-leagues.service';
import { PlayerResponse } from '../players/players-response';

@Service()
export class TeamTradesService {
  private readonly http = inject(HttpClient);

  
  createTrade(trade: CreateTradeDto){
      this.http.post<TradeDto>('/api/trades', trade);
  }

  getUserTrades(): Observable<TradeDto[]>{
    return this.http.get<TradeDto[]>('/api/trades');
  }

  getLeagueTrades(id: number): Observable<TradeDto[]>{
    return this.http.get<TradeDto[]>("/api/league/" + id + "/trades");
  }

  getLeagueTeams(id: number): Observable<TeamResponse[]>{
    return this.http.get<TeamResponse[]>("");
  }

  getTeamPlayers(teamId: number): Observable<PlayerResponse[]>{
    return this.http.get<PlayerResponse[]>("");
  }
}