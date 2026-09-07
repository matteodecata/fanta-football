import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TeamsApiService } from '../teams/teams-api.service';
import { RenameTeam } from './rename-team/rename-team';
import { TeamRoster } from './team-roster/team-roster';

@Component({
  selector: 'app-team-detail',
  imports: [RouterLink, RenameTeam, TeamRoster],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TeamsApiService);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly teamId = computed(() => Number(this.params().get('teamId')));
  protected readonly leagues = this.api.leagues();
  protected readonly membership = computed(() => {
    const items = this.leagues.hasValue() ? this.leagues.value() : [];
    const requested = Number(this.query().get('leagueId'));
    return items.find(item => item.league.id === requested) ?? items.find(item => item.team?.id === this.teamId());
  });
  protected readonly leagueId = computed(() => this.membership()?.league.id ?? null);
  protected readonly teamResource = this.api.teams(this.leagueId);
  protected readonly team = computed(() => this.teamResource.hasValue()
    ? this.teamResource.value().find(team => team.teamId === this.teamId()) : undefined);
  protected readonly isLoading = computed(() => this.leagues.isLoading() || this.teamResource.isLoading());
  protected readonly hasError = computed(() => !!this.leagues.error() || !!this.teamResource.error());
  protected readonly isOwner = computed(() => this.membership()?.team?.id === this.teamId());
  protected readonly canManageRoster = computed(() => this.isOwner() || this.membership()?.admin === true);

  protected retry(): void {
    this.leagues.reload();
    this.teamResource.reload();
  }
}
