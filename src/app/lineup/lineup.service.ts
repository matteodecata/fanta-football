import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { LineupRequest, LineupResponse, LineupTypeResponse, PlayerRatingResponse } from './lineup.models';

@Service()
export class LineupService {
  private readonly http = inject(HttpClient);

  private readonly lineupUrl = (teamId: number, leagueMatchId: number) =>
    `/api/teams/${teamId}/matches/${leagueMatchId}/lineup`;

  getPlayerRatings(teamId: number, leagueMatchId: number): Observable<PlayerRatingResponse[]> {
    return this.http.get<PlayerRatingResponse[]>(`/api/teams/${teamId}/matches/${leagueMatchId}/players/ratings`);
  }

  getLineupTypes(): Observable<LineupTypeResponse[]> {
    return this.http.get<LineupTypeResponse[]>('/api/lineup-types');
  }

  getLineup(teamId: number, leagueMatchId: number): Observable<LineupResponse | null> {
    return this.http.get<LineupResponse>(this.lineupUrl(teamId, leagueMatchId)).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      }),
    );
  }

  createLineup(teamId: number, leagueMatchId: number, request: LineupRequest): Observable<LineupResponse> {
    return this.http.post<LineupResponse>(this.lineupUrl(teamId, leagueMatchId), request);
  }

  updateLineup(teamId: number, leagueMatchId: number, request: LineupRequest): Observable<LineupResponse> {
    return this.http.put<LineupResponse>(this.lineupUrl(teamId, leagueMatchId), request);
  }
}
