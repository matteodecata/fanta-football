import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TeamResponse } from '../../dashboard/user-leagues/user-leagues.service';
import { TradeDto, TradeStatus } from '../../team-trades/team-trades.models';

@Component({
  selector: 'app-league-trades',
  imports: [DatePipe],
  templateUrl: './league-trades.html',
  styleUrls: ['../../team-trades/team-trades.css', './league-trades.css'],
})
export class LeagueTrades {
  readonly leagueId = input.required<number>();
  private readonly http = inject(HttpClient);
  protected readonly tradesResource = httpResource<TradeDto[]>(
    () => `/api/leagues/${this.leagueId()}/trades`, { defaultValue: [] },
  );
  protected readonly teamsResource = httpResource<TeamResponse[]>(
    () => '/api/teams/me', { defaultValue: [] },
  );
  private readonly ownedTeamIds = computed(() => new Set(
    this.teamsResource.hasValue()
      ? this.teamsResource.value().filter(team => team.leagueId === this.leagueId()).map(team => team.id)
      : [],
  ));
  protected readonly trades = computed(() => this.tradesResource.hasValue()
    ? this.tradesResource.value() : []);
  protected readonly pendingId = signal<number | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionMessage = signal('');
  protected readonly statusLabels: Record<TradeStatus, string> = {
    PENDING: 'In attesa', ACCEPTED: 'Accettato', REJECTED: 'Rifiutato', CANCELLED: 'Annullato',
  };

  protected canAccept(trade: TradeDto): boolean {
    return trade.status === 'PENDING' && this.ownedTeamIds().has(trade.receivingTeamId);
  }

  protected canReject(trade: TradeDto): boolean {
    return trade.status === 'PENDING' && (this.ownedTeamIds().has(trade.receivingTeamId)
      || this.ownedTeamIds().has(trade.proposingTeamId));
  }

  protected async respond(trade: TradeDto, status: 'ACCEPTED' | 'REJECTED'): Promise<void> {
    if (this.pendingId() !== null || this.tradesResource.isLoading()
      || !(status === 'ACCEPTED' ? this.canAccept(trade) : this.canReject(trade))) return;
    this.pendingId.set(trade.id);
    this.actionError.set(null);
    this.actionMessage.set('');
    try {
      await firstValueFrom(this.http.patch<void>(`/api/trades/${trade.id}`, { status }));
      this.actionMessage.set(status === 'ACCEPTED' ? 'Scambio accettato.' : 'Scambio rifiutato.');
      // Reload all trades: accepting one can cancel other conflicting proposals.
      this.tradesResource.reload();
    } catch {
      this.actionError.set('Non è stato possibile aggiornare lo scambio. Riprova.');
    } finally {
      this.pendingId.set(null);
    }
  }
}
