import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, expand, reduce } from 'rxjs';
import { UserLeagueTeamResponse } from '../dashboard/user-leagues/user-leagues.service';
import { LeagueStandingResponse } from '../league-detail/league-detail.models';
import { PageResponse, PlayerResponse } from '../players/players-response';
import { TeamPlayerResponse } from '../team-detail/team-detail.models';

@Service()
export class TeamsApiService {
  private readonly http = inject(HttpClient);

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
    return rxResource({
      stream: () => this.playerPage(0).pipe(
        expand(page => page.number + 1 < page.totalPages ? this.playerPage(page.number + 1) : EMPTY),
        reduce((players, page) => [...players, ...page.content], [] as PlayerResponse[]),
      ),
      defaultValue: [],
    });
  }

  private playerPage(page: number) {
    return this.http.get<PageResponse>('/api/players', { params: { page, size: 100 } });
  }
}
