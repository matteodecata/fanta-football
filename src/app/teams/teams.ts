import { Component, computed, inject, linkedSignal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TeamsApiService } from './teams-api.service';

@Component({
  selector: 'app-teams',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams {
  private readonly api = inject(TeamsApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly leagues = this.api.leagues();
  protected readonly selectedLeagueId = computed(() => {
    const items = this.leagues.hasValue() ? this.leagues.value() : [];
    const requested = Number(this.params().get('leagueId'));
    return items.some(item => item.league.id === requested) ? requested : items.length === 1 ? items[0].league.id : null;
  });
  protected readonly search = linkedSignal(() => { this.selectedLeagueId(); return ''; });
  protected readonly teams = this.api.teams(this.selectedLeagueId);
  protected readonly visibleTeams = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('it');
    return (this.teams.hasValue() ? this.teams.value() : []).filter(team =>
      `${team.teamName} ${team.username}`.toLocaleLowerCase('it').includes(term));
  });

  protected selectLeague(value: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { leagueId: value || null } });
  }
}
