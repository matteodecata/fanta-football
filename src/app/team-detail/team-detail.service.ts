import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RenameTeamRequest, TeamDetailResponse, TeamPlayerResponse } from './team-detail.models';

@Service({ autoProvided: true })
export class TeamDetailService {
  private readonly http = inject(HttpClient);

  getTeamById(teamId: number) {
    return this.http.get<TeamDetailResponse>(`/api/teams/${teamId}`);
  }

  getTeamRoster(teamId: number) {
    return this.http.get<TeamPlayerResponse[]>(`/api/teams/${teamId}/players`);
  }

  renameTeam(teamId: number, request: RenameTeamRequest) {
    return this.http.patch<TeamDetailResponse>(`/api/teams/${teamId}`, request);
  }

  releasePlayer(teamId: number, playerId: number) {
    return this.http.delete<void>(`/api/teams/${teamId}/players/${playerId}`);
  }

  async renameTeamOnce(teamId: number, request: RenameTeamRequest) {
    return firstValueFrom(this.renameTeam(teamId, request));
  }
}
