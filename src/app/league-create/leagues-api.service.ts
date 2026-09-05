import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CreateLeagueRequest, LeagueResponse } from './league-create.models';

@Service({ autoProvided: true })
export class LeaguesApiService {
  private readonly http = inject(HttpClient);

  createLeague(request: CreateLeagueRequest) {
    return this.http.post<LeagueResponse>('/api/leagues', request);
  }
}
