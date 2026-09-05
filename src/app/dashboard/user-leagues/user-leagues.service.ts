import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

export interface LeagueResponse {
  id: number;
  name: string;
}

export interface TeamResponse {
  id: number;
  name: string;
  userId: number;
  leagueId: number;
  leagueName: string;
  budget: number;
  totalPoints: number;
}

export interface UserLeagueTeamResponse {
  league: LeagueResponse;
  team: TeamResponse | null;
  admin: boolean;
}

@Service()
export class UserLeaguesService {
  readonly userLeagues = httpResource<UserLeagueTeamResponse[]>(() => '/api/account/me/leagues', {
    defaultValue: [],
  });
}
