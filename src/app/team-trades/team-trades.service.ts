import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from "rxjs";
import { TeamResponse } from '../dashboard/user-leagues/user-leagues.service';
import { LeagueDetailResponse } from '../league-detail/league-detail.models';
import { TeamPlayerResponse } from '../team-detail/team-detail.models';
import { CreateTradeDto, TeamStandingResponse, TradeDto } from './team-trades.models';

@Service()
export class TeamTradesService {
  private readonly http = inject(HttpClient);

  
  createTrade(trade: CreateTradeDto): Observable<TradeDto> {
    return this.http.post<TradeDto>('/api/trades', trade);
  }

  getUserTrades(): Observable<TradeDto[]>{
    return this.http.get<TradeDto[]>('/api/trades');
  }

  getLeagueTrades(id: number): Observable<TradeDto[]>{
    return this.http.get<TradeDto[]>("/api/leagues/" + id + "/trades");
  }
  
  getLeague(id: number): Observable<LeagueDetailResponse>{
    return this.http.get<LeagueDetailResponse>(`/api/leagues/${id}`);
  }

  getLeagueTeams(id: number): Observable<TeamStandingResponse[]>{
    return this.http.get<TeamStandingResponse[]>("/api/leagues/" + id + "/teams");
  }

  getTeamPlayers(teamId: number): Observable<TeamPlayerResponse[]>{
    return this.http.get<TeamPlayerResponse[]>(`/api/teams/${teamId}/players`);
  }

  getUserTeams(): Observable<TeamResponse[]>{
    return this.http.get<TeamResponse[]>("/api/teams/me");
  }
}