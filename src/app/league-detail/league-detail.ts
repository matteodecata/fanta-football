import { Component, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { InviteLeague } from './invite-league/invite-league';
import { Standings } from './standings/standings';
import { LeagueDetailResponse, LeagueStandingResponse } from './league-detail.models';

@Component({
  selector: 'app-league-detail',
  imports: [Standings, InviteLeague],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  private readonly route = inject(ActivatedRoute);

  protected readonly leagueId = Number(this.route.snapshot.paramMap.get('leagueId'));

  protected readonly leagueResource = httpResource<LeagueDetailResponse | null>(() => {
    if (!this.leagueId || Number.isNaN(this.leagueId)) {
      return undefined;
    }

    return {
      url: `/api/leagues/${this.leagueId}`,
      method: 'GET',
    };
  });

  protected readonly standingsResource = httpResource<LeagueStandingResponse[]>(() => {
    if (!this.leagueId || Number.isNaN(this.leagueId)) {
      return undefined;
    }

    return {
      url: `/api/leagues/${this.leagueId}/standings`,
      method: 'GET',
    };
  });

  protected readonly isLoading = computed(
    () =>
      this.leagueResource.status() === 'loading' ||
      this.standingsResource.status() === 'loading'
  );

  protected readonly hasError = computed(
    () =>
      this.leagueResource.error() !== undefined ||
      this.standingsResource.error() !== undefined
  );

  protected readonly league = computed(() => this.leagueResource.value() ?? null);

  protected readonly standings = computed(() => this.standingsResource.value() ?? []);
}
