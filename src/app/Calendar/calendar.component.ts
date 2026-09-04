import { DatePipe } from '@angular/common';
import { afterNextRender, Component, computed, inject, input, signal } from '@angular/core';
import { CalendarApiService, CalendarMatch, CalendarScore } from './calendar-api.service';

type CalendarStatus = 'idle' | 'loading' | 'ready' | 'not-generated' | 'already-generated' | 'no-open-matchday' | 'error';

@Component({
  selector: 'app-calendar',
  imports: [DatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent {
  readonly leagueId = input.required<number>();
  readonly isAdmin = input(false);

  private readonly calendarApi = inject(CalendarApiService);
  readonly status = signal<CalendarStatus>('idle');
  readonly matches = signal<CalendarMatch[]>([]);
  readonly scoreByLineupId = signal<Record<number, CalendarScore>>({});
  readonly loadingScoreFor = signal<number | null>(null);
  readonly scoreStatus = signal<Record<number, 'loading' | 'ready' | 'not-closed' | 'error'>>({});
  readonly errorMessage = signal('');

  constructor() {
    afterNextRender(() => this.loadCalendar(this.leagueId()));
  }

  readonly groupedMatches = computed(() => {
    const groups = new Map<number, CalendarMatch[]>();
    for (const match of this.matches()) {
      const current = groups.get(match.roundNumber) ?? [];
      groups.set(match.roundNumber, [...current, match]);
    }
    return [...groups.entries()].map(([roundNumber, matches]) => ({ roundNumber, matches }));
  });

  readonly canGenerate = computed(() => this.isAdmin() && this.status() === 'not-generated');

  private loadCalendar(leagueId: number): void {
    if (!Number.isInteger(leagueId) || leagueId <= 0) {
      this.status.set('error');
      this.errorMessage.set('Identificativo della lega non valido.');
      return;
    }

    this.status.set('loading');
    this.errorMessage.set('');
    this.calendarApi.getCalendar(leagueId).subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.status.set(matches.length > 0 ? 'ready' : 'not-generated');
      },
      error: (error: unknown) => {
        const code = this.getErrorCode(error);
        if (code === 'calendar_not_found' || code === 'not_found' || this.getHttpStatus(error) === 404) {
          this.status.set('not-generated');
          return;
        }
        this.status.set('error');
        this.errorMessage.set('Non è stato possibile caricare il calendario. Riprova più tardi.');
      },
    });
  }

  generateCalendar(): void {
    if (!this.canGenerate()) return;

    this.status.set('loading');
    this.errorMessage.set('');
    this.calendarApi.generateCalendar(this.leagueId()).subscribe({
      next: (response) => {
        this.matches.set(response);
        this.status.set('ready');
      },
      error: (error: unknown) => this.handleGenerationError(error),
    });
  }

  retry(): void {
    this.loadCalendar(this.leagueId());
  }

  loadScore(match: CalendarMatch): void {
    if (match.lineupId === undefined || this.loadingScoreFor() !== null) return;

    this.loadingScoreFor.set(match.lineupId);
    this.scoreStatus.update((statuses) => ({ ...statuses, [match.lineupId!]: 'loading' }));
    this.calendarApi.getScore(match.lineupId).subscribe({
      next: (score) => {
        this.scoreByLineupId.update((scores) => ({ ...scores, [match.lineupId!]: score }));
        this.scoreStatus.update((statuses) => ({ ...statuses, [match.lineupId!]: 'ready' }));
        this.loadingScoreFor.set(null);
      },
      error: (error: unknown) => {
        const code = this.getErrorCode(error);
        this.scoreStatus.update((statuses) => ({
          ...statuses,
          [match.lineupId!]: code === 'matchday_not_closed' ? 'not-closed' : 'error',
        }));
        this.loadingScoreFor.set(null);
      },
    });
  }

  scoreFor(match: CalendarMatch): CalendarScore | undefined {
    return match.lineupId === undefined ? undefined : this.scoreByLineupId()[match.lineupId];
  }

  scoreStateFor(match: CalendarMatch): string | undefined {
    return match.lineupId === undefined ? undefined : this.scoreStatus()[match.lineupId];
  }

  private handleGenerationError(error: unknown): void {
    const code = this.getErrorCode(error);
    if (code === 'calendar_already_generated') {
      this.status.set('already-generated');
      this.errorMessage.set('Il calendario è già stato generato e non può essere ricreato.');
    } else if (code === 'no_open_matchday' || code === 'no_open_matchdays') {
      this.status.set('no-open-matchday');
      this.errorMessage.set('Non ci sono giornate aperte per generare il calendario.');
    } else {
      this.status.set('error');
      this.errorMessage.set('Non è stato possibile generare il calendario. Riprova più tardi.');
    }
  }

  private getErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const payload = error as { error?: { errorCode?: unknown; code?: unknown } | unknown; errorCode?: unknown };
    if (typeof payload.errorCode === 'string') return payload.errorCode;
    if (typeof payload.error === 'object' && payload.error !== null) {
      const body = payload.error as { errorCode?: unknown; code?: unknown };
      if (typeof body.errorCode === 'string') return body.errorCode;
      if (typeof body.code === 'string') return body.code;
    }
    return undefined;
  }

  private getHttpStatus(error: unknown): number | undefined {
    return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
      ? error.status
      : undefined;
  }
}
