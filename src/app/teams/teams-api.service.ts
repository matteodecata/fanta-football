import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';
import { UserLeagueTeamResponse } from '../dashboard/user-leagues/user-leagues.service';
import { LeagueStandingResponse } from '../league-detail/league-detail.models';
import { PlayerResponse } from '../players/players-response';
import { TeamPlayerResponse } from '../team-detail/team-detail.models';

@Service()
export class TeamsApiService {
  leagues() {
    return httpResource<UserLeagueTeamResponse[]>(() => '/api/account/me/leagues', { defaultValue: [] });
  }

  teams(leagueId: () => number | null) {
    return httpResource<LeagueStandingResponse[]>(() => {
      const id = leagueId();
      return id && Number.isSafeInteger(id) && id > 0 ? `/api/leagues/${id}/teams` : undefined;
    }, { defaultValue: [] });
  }

  roster(teamId: () => number) {
    return httpResource<TeamPlayerResponse[]>(() => {
      const id = teamId();
      return Number.isSafeInteger(id) && id > 0 ? `/api/teams/${id}/players` : undefined;
    }, { defaultValue: [] });
  }

  players() {
    return httpResource<PlayerResponse[]>(() => '/api/players', { defaultValue: [] });
  }
}
