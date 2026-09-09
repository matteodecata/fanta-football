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
  // Confermati su Swagger il 9 settembre 2026: homeScore/awayScore sono i
  // fantapunti delle due squadre; homeGoals/awayGoals sono i "fantagol"
  // derivati dallo score (regola di conversione lato backend) e determinano
  // il vincitore. matchdayClosed indica se la giornata è chiusa: prima di
  // questa chiusura questi valori non sono ancora significativi.
  readonly homeScore: number;
  readonly awayScore: number;
  readonly homeGoals: number;
  readonly awayGoals: number;
  readonly matchdayClosed: boolean;
  // Non ancora esposti dal backend (sezione 14 di PROJECT_CONTEXT.md):
  // servirebbero per chiamare getScore() per singola lineup. Restano
  // opzionali finché il DTO non li include davvero.
  readonly lineupId?: number;
  readonly homeLineupId?: number;
  readonly awayLineupId?: number;
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
