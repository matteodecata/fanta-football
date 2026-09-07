import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TeamTradesService } from './team-trades.service';
import { ActivatedRoute } from '@angular/router';


type TradeTab = 'received' | 'sent' | 'history';

interface TeamOption {
  id: number;
  name: string;
}

@Component({
  imports: [FormField],
  templateUrl: './team-trades.html',
  styleUrl: './team-trades.css',
})
export class TeamTrades {

  private readonly tradeService = inject(TeamTradesService);
  private readonly route = inject(ActivatedRoute);
  private readonly leagueIdParam = this.route.snapshot.paramMap.get('leagueId');
  readonly leagueId = this.leagueIdParam === null
    ? null
    : Number(this.leagueIdParam);

  private readonly _proposals = signal<TradeDto[]>([]);
  readonly proposals = this._proposals.asReadonly();
  

  readonly newProposal = signal<CreateTradeDto>({
    receivingTeamId: '0',
    requestedPlayerId: '0',
    offeredPlayerId: '0',
    amount: 0,
  });
  readonly proposalForm = form(this.newProposal);

  readonly leagueTeams = signal<TeamOption[]>([]);
  readonly availablePlayers = signal<Player[]>([]);

  readonly activeTab = signal<TradeTab>('received');
  readonly loadError = signal<string | null>(null);

  readonly visibleTrades = computed(() => {
    const trades = this.proposals();
    const tab = this.activeTab();
    const currentTeamId = 1; // Replace with the logged-in team's ID

    if (tab === 'received') {
      return trades.filter(
        trade =>
          trade.receivingTeamId === currentTeamId &&
          trade.status === 'PENDING',
      );
    }

    if (tab === 'sent') {
      return trades.filter(
        trade =>
          trade.proposingTeamId === currentTeamId &&
          trade.status === 'PENDING',
      );
    }

    return trades.filter(trade => trade.status !== 'PENDING');
  });

  ngOnInit(): void {
    const trades$ = this.leagueId === null
    ? this.tradeService.getUserTrades()
    : this.tradeService.getLeagueTrades(this.leagueId);

    trades$.subscribe({
      next: (trades) => this._proposals.set(trades),
      error: (error) => {
        console.error('Errore nel caricamento degli scambi:', error);
        this.loadError.set('Impossibile caricare gli scambi.');
      },
    });
  }

  selectTab(tab: TradeTab): void {
    this.activeTab.set(tab);
  }

  submitProposal(event: SubmitEvent): void {
    event.preventDefault();

    const proposal = this.newProposal();
  }
}
