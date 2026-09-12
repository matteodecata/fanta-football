import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TeamPlayerResponse } from '../../team-detail/team-detail.models';
import { TeamTradesService } from '../../team-trades/team-trades.service';
import { CreateTradeDto, TeamStandingResponse } from '../../team-trades/team-trades.models';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TeamResponse } from '../../dashboard/user-leagues/user-leagues.service';
import { TradeDto, TradeStatus } from '../../team-trades/team-trades.models';

@Component({
  selector: 'app-league-trades',
  imports: [DatePipe, FormField],
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

  private readonly tradeService = inject(TeamTradesService);
  protected readonly currentTeamId = computed(() => [...this.ownedTeamIds()][0] ?? null);
  protected readonly leagueTeamsResource = httpResource<TeamStandingResponse[]>(
    () => this.currentTeamId() ? '/api/leagues/' + this.leagueId() + '/teams' : undefined,
    { defaultValue: [] },
  );
  protected readonly receivingTeams = computed(() => this.leagueTeamsResource.hasValue()
    ? this.leagueTeamsResource.value().filter(team => !this.ownedTeamIds().has(team.teamId)) : []);
  protected readonly newProposal = signal<CreateTradeDto>({
    receivingTeamId: 0, requestedPlayerId: 0, offeredPlayerId: 0, amount: 0,
  });
  protected readonly proposalForm = form(this.newProposal);
  protected readonly hasReceivingTeam = computed(() => this.receivingTeams()
    .some(team => team.teamId === this.newProposal().receivingTeamId));
  protected readonly offeredPlayersResource = httpResource<TeamPlayerResponse[]>(
    () => this.currentTeamId() ? '/api/teams/' + this.currentTeamId() + '/players' : undefined,
    { defaultValue: [] },
  );
  private readonly receivingTeamId = computed(() => this.newProposal().receivingTeamId);
  protected readonly availablePlayersResource = httpResource<TeamPlayerResponse[]>(
    () => this.hasReceivingTeam() ? '/api/teams/' + this.receivingTeamId() + '/players' : undefined,
    { defaultValue: [] },
  );
  protected readonly offeredPlayers = computed(() => this.offeredPlayersResource.hasValue()
    ? this.offeredPlayersResource.value() : []);
  protected readonly availablePlayers = computed(() => this.availablePlayersResource.hasValue()
    ? this.availablePlayersResource.value() : []);
  protected readonly submitting = signal(false);
  protected readonly proposalError = signal<string | null>(null);
  protected readonly proposalMessage = signal('');
  protected readonly canSubmit = computed(() => {
    const proposal = this.newProposal();
    return !this.submitting() && this.hasReceivingTeam()
      && !this.offeredPlayersResource.isLoading() && !this.availablePlayersResource.isLoading()
      && this.offeredPlayers().some(player => player.id === proposal.offeredPlayerId)
      && this.availablePlayers().some(player => player.id === proposal.requestedPlayerId)
      && Number.isFinite(proposal.amount);
  });

  protected onReceivingTeamChange(event: Event): void {
    const receivingTeamId = Number((event.target as HTMLSelectElement).value);
    this.newProposal.update(proposal => ({ ...proposal, receivingTeamId, requestedPlayerId: 0 }));
    this.proposalMessage.set('');
  }

  protected onPlayerChange(field: 'offeredPlayerId' | 'requestedPlayerId', event: Event): void {
    const playerId = Number((event.target as HTMLSelectElement).value);
    this.newProposal.update(proposal => ({ ...proposal, [field]: playerId }));
  }

  protected async submitProposal(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.proposalError.set(null);
    this.proposalMessage.set('');
    try {
      await firstValueFrom(this.tradeService.createTrade(this.newProposal()));
      this.newProposal.set({ receivingTeamId: 0, requestedPlayerId: 0, offeredPlayerId: 0, amount: 0 });
      this.proposalMessage.set('Proposta inviata.');
      this.tradesResource.reload();
    } catch {
      this.proposalError.set('Impossibile inviare la proposta. Riprova.');
    } finally {
      this.submitting.set(false);
    }
  }

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
