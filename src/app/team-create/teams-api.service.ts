import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CreateTeamRequest, TeamResponse } from './team-create.models';

@Service({ autoProvided: true })
export class TeamsApiService {
  private readonly http = inject(HttpClient);

  createTeam(request: CreateTeamRequest) {
    return this.http.post<TeamResponse>('/api/teams', request);
  }
}