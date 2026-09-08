import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CalendarComponent } from '../Calendar/calendar.component';
import { Session } from '../core/auth/session';
import { InviteLeague } from './invite-league/invite-league';
import { Standings } from './standings/standings';
import { LeagueDetailResponse } from './league-detail.models';

@Component({
  selector: 'app-league-detail',
  imports: [Standings, InviteLeague, CalendarComponent, RouterLink],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(Session);
  protected readonly inviteFormVisible = signal(false);
  protected toggleInviteForm(): void {
    this.inviteFormVisible.update(visible => !visible);
  }

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

  // protected readonly standingsResource = httpResource<LeagueStandingResponse[]>(() => {
  //   if (!this.leagueId || Number.isNaN(this.leagueId)) {
  //     return undefined;
  //   }

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
  );

  protected readonly hasError = computed(
    () =>
      this.leagueResource.error() !== undefined 
    // ||
      // this.standingsResource.error() !== undefined
  );

  protected readonly league = computed(() => this.leagueResource.value() ?? null);

  protected readonly isAdmin = computed(() => {
    const league = this.league();
    const userId = this.session.userId();
    return league !== null && userId !== null && league.adminUserId === userId;
  });

  // protected readonly standings = computed(() => this.standingsResource.value() ?? []);
}
