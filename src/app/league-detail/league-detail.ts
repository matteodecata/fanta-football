import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CalendarComponent } from '../Calendar/calendar.component';
import { Session } from '../core/auth/session';
import { InviteLeague } from './invite-league/invite-league';
import { Standings } from './standings/standings';
import { LeagueDetailResponse, LeagueStandingResponse } from './league-detail.models';

@Component({
  selector: 'app-league-detail',
  imports: [RouterLink, Standings, InviteLeague, CalendarComponent],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(Session);
  protected readonly connectedUsername = this.session.username;
  protected readonly inviteFormVisible = signal(false);
  protected toggleInviteForm(): void {
    this.inviteFormVisible.update(visible => !visible);
  }

  protected readonly leagueId = Number(this.route.snapshot.paramMap.get('leagueId'));
  protected readonly teamsResource = httpResource<LeagueStandingResponse[]>(
    () => Number.isSafeInteger(this.leagueId) && this.leagueId > 0
      ? `/api/leagues/${this.leagueId}/teams` : undefined,
    { defaultValue: [] },
  );
  protected readonly teams = computed(() => this.teamsResource.hasValue()
    ? [...this.teamsResource.value()].sort((a, b) => b.totalPoints - a.totalPoints) : []);

  protected readonly leagueResource = httpResource<LeagueDetailResponse | null>(() => {
    if (!this.leagueId || Number.isNaN(this.leagueId)) {
      return undefined;
    }

    return {
      url: `/api/leagues/${this.leagueId}`,
      method: 'GET',
    };
  });

  // protected readonly standingsResource = httpResource<LeagueStandingResponse[]>(() => {
  //   if (!this.leagueId || Number.isNaN(this.leagueId)) {
  //     return undefined;
  //   }
  // protected readonly standingsResource = httpResource<LeagueStandingResponse[]>(() => {
  //   if (!this.leagueId || Number.isNaN(this.leagueId)) {
  //     return undefined;
  //   }

  //   return {
  //     url: `/api/leagues/${this.leagueId}/standings`,
  //     method: 'GET',
  //   };
  // });
  //   return {
  //     url: `/api/leagues/${this.leagueId}/standings`,
  //     method: 'GET',
  //   };
  // });

  protected readonly isLoading = computed(
    () =>
      this.leagueResource.status() === 'loading' 
    // ||
      // this.standingsResource.status() === 'loading'
      this.leagueResource.status() === 'loading' 
    // ||
      // this.standingsResource.status() === 'loading'
  );

  protected readonly hasError = computed(
    () =>
      this.leagueResource.error() !== undefined 
    // ||
      // this.standingsResource.error() !== undefined
      this.leagueResource.error() !== undefined 
    // ||
      // this.standingsResource.error() !== undefined
  );

  protected readonly league = computed(() => this.leagueResource.hasValue() ? this.leagueResource.value() : null);

  protected readonly isAdmin = computed(() => {
    const league = this.league();
    const userId = this.session.userId();
    return league !== null && userId !== null && league.adminUserId === userId;
  });
  protected readonly isAdmin = computed(() => {
    const league = this.league();
    const userId = this.session.userId();
    return league !== null && userId !== null && league.adminUserId === userId;
  });

  // protected readonly standings = computed(() => this.standingsResource.value() ?? []);
  // protected readonly standings = computed(() => this.standingsResource.value() ?? []);
}
