import { Component, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { TeamDetailResponse } from './team-detail.models';
import { RenameTeam } from './rename-team/rename-team';
import { TeamRoster } from './team-roster/team-roster';

@Component({
  selector: 'app-team-detail',
  imports: [RenameTeam, TeamRoster],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail {
  private readonly route = inject(ActivatedRoute);

  protected readonly teamId = Number(this.route.snapshot.paramMap.get('teamId'));

  protected readonly teamResource = httpResource<TeamDetailResponse | null>(() => {
    if (!this.teamId || Number.isNaN(this.teamId)) {
      return undefined;
    }

    return {
      url: `/api/teams/${this.teamId}`,
      method: 'GET',
    };
  });

  protected readonly isLoading = computed(() => this.teamResource.status() === 'loading');
  protected readonly hasError = computed(() => this.teamResource.error() !== undefined);
  protected readonly team = computed(() => this.teamResource.value() ?? null);
}
