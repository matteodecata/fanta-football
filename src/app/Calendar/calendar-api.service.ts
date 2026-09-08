import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface CalendarMatch {
  readonly id: number;
  readonly roundNumber: number;
  readonly matchDay?: string | number | null;
  readonly homeTeamId: number;
  readonly homeTeamName: string;
  readonly awayTeamId: number;
  readonly awayTeamName: string;
  readonly lineupId?: number;
  readonly homeLineupId?: number;
  readonly awayLineupId?: number;
  readonly homeScore?: number | null;
  readonly awayScore?: number | null;
  readonly status?: string | null;
}

export interface CalendarScore {
  readonly score: number;
  readonly goals: number;
}

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly http = inject(HttpClient);

  private readonly calendarUrl = (leagueId: number) => `/api/leagues/${leagueId}/matches`;

  generateCalendar(leagueId: number): Observable<CalendarMatch[]> {
    return this.http.post<CalendarResponse>(this.calendarUrl(leagueId), null).pipe(map((response) => this.toMatches(response)));
  }

  getCalendar(leagueId: number): Observable<CalendarMatch[]> {
    return this.http.get<CalendarResponse>(this.calendarUrl(leagueId)).pipe(map((response) => this.toMatches(response)));
  }

  getScore(lineupId: number): Observable<CalendarScore> {
    return this.http.get<CalendarScore>(`/api/lineups/${lineupId}/score`);
  }

  private toMatches(response: CalendarResponse): CalendarMatch[] {
    if (Array.isArray(response)) return response;
    return response.matches ?? response.calendar ?? [];
  }
}

type CalendarResponse = CalendarMatch[] | {
  readonly matches?: CalendarMatch[];
  readonly calendar?: CalendarMatch[];
};
