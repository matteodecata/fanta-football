import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface CalendarMatch {
  readonly id: number;
  readonly roundNumber: number;
  readonly matchDay?: string | null;
  readonly homeTeamId: number;
  readonly homeTeamName: string;
  readonly awayTeamId: number;
  readonly awayTeamName: string;
  readonly lineupId?: number;
}

export interface CalendarScore {
  readonly score: number;
  readonly goals: number;
}

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly http = inject(HttpClient);

  generateCalendar(leagueId: number): Observable<CalendarMatch[]> {
    return this.http.post<CalendarMatch[] | { matches?: CalendarMatch[]; calendar?: CalendarMatch[] }>(
      `/api/leagues/${leagueId}/matches`,
      null,
    ).pipe(map((response) => Array.isArray(response) ? response : response.matches ?? response.calendar ?? []));
  }

  getScore(lineupId: number): Observable<CalendarScore> {
    return this.http.get<CalendarScore>(`/api/lineups/${lineupId}/score`);
  }
}
