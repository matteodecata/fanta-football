import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CalendarComponent } from '../Calendar/calendar.component';
import { LeagueTrades } from './league-trades/league-trades';
import { Session } from '../core/auth/session';
import { InviteLeague } from './invite-league/invite-league';
import { Standings } from './standings/standings';
import { LeagueDetailResponse, LeagueStandingResponse } from './league-detail.models';

@Component({
  selector: 'app-league-detail',
  imports: [RouterLink, Standings, InviteLeague, CalendarComponent, LeagueTrades],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  protected readonly sections = [
    { id: 'standings', label: 'Classifica' },
    { id: 'calendar', label: 'Calendario' },
    { id: 'members', label: 'Partecipanti' },
    { id: 'trades', label: 'Scambi' },
  ] as const;
  protected readonly activeSection = signal<string>('standings');

  protected navigateTabs(event: KeyboardEvent, index: number): void {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % this.sections.length;
    else if (event.key === 'ArrowLeft') next = (index + this.sections.length - 1) % this.sections.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = this.sections.length - 1;
    else return;
    event.preventDefault();
    this.activeSection.set(this.sections[next].id);
    const button = event.currentTarget as HTMLButtonElement;
    button.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
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
    // ||
      // this.standingsResource.status() === 'loading'
  );

  protected readonly hasError = computed(
    () =>
      this.leagueResource.error() !== undefined 
    // ||
      // this.standingsResource.error() !== undefined
    // ||
      // this.standingsResource.error() !== undefined
  );

  protected readonly league = computed(() => this.leagueResource.hasValue() ? this.leagueResource.value() : null);

  protected readonly isAdmin = computed(() => {
    const league = this.league();
    const userId = this.session.userId();
    return league !== null && userId !== null && league.adminUserId === userId;
  });

  // La propria squadra nella lega si individua confrontando lo username
  // connesso con quello di ogni squadra in classifica: LeagueStandingResponse
  // non espone lo userId, solo lo username (sezione 9 di PROJECT_CONTEXT.md).
  // Serve al Calendario per sapere su quali partite mostrare il pulsante
  // "Formazione" (solo sulle proprie, non su quelle altrui).
  protected readonly myTeamId = computed(() => {
    const username = this.connectedUsername();
    if (!username) return null;
    return this.teams().find((team) => team.username === username)?.teamId ?? null;
  });

  // protected readonly standings = computed(() => this.standingsResource.value() ?? []);
  // protected readonly standings = computed(() => this.standingsResource.value() ?? []);
}
