import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TeamTradesService } from './team-trades.service';
import { ActivatedRoute } from '@angular/router';
import { PlayerResponse } from '../players/players-response';
import { CreateTradeDto, TeamStandingResponse, TradeDto } from './team-trades.models';


type TradeTab = 'received' | 'sent' | 'history';

@Component({
  imports: [FormField],
  templateUrl: './team-trades.html',
  styleUrl: './team-trades.css',
})
export class TeamTrades {
  private readonly tradeService = inject(TeamTradesService);
  private readonly route = inject(ActivatedRoute);
  private readonly leagueIdParam = this.route.snapshot.paramMap.get('leagueId');
  readonly leagueId: number | null = this.leagueIdParam === null
    ? null
    : Number(this.leagueIdParam);

  private readonly teamIdParam = this.route.snapshot.paramMap.get('teamId');
  readonly teamId: number | null = this.teamIdParam === null
    ? null
    : Number(this.teamIdParam);
  readonly leagueName = signal<string | null>(null);

  private readonly _proposals = signal<TradeDto[]>([]);
  readonly proposals = this._proposals.asReadonly();

  readonly newProposal = signal<CreateTradeDto>({
    receivingTeamId: '0',
    requestedPlayerId: '0',
    offeredPlayerId: '0',
    amount: 0,
  });

  readonly proposalForm = form(this.newProposal);

  readonly leagueTeams = signal<TeamStandingResponse[]>([]);
  private readonly userTeamIds = signal<number[]>([]);

  readonly currentTeamName = computed(() =>
    this.leagueTeams().find(team => team.teamId === this.teamId)?.teamName ?? null,
  );

  readonly availablePlayers = signal<PlayerResponse[]>([]);

  readonly activeTab = signal<TradeTab>('received');
  readonly loadError = signal<string | null>(null);

  private readonly ownedTeamIds = computed(() => {
    if (this.leagueId !== null) {
      return this.teamId === null ? [] : [this.teamId];
    }

    return this.userTeamIds();
  });

  readonly receivedTrades = computed(() => {
    const ownedTeamIds = new Set(this.ownedTeamIds());

    return this.proposals().filter(
      trade =>
        ownedTeamIds.has(trade.receivingTeamId) &&
        trade.status === 'PENDING',
    );
  });

  readonly sentTrades = computed(() => {
    const ownedTeamIds = new Set(this.ownedTeamIds());

    return this.proposals().filter(
      trade =>
        ownedTeamIds.has(trade.proposingTeamId) &&
        trade.status === 'PENDING',
    );
  });

  readonly visibleTrades = computed(() => {
    const tab = this.activeTab();

    if (tab === 'received') {
      return this.receivedTrades();
    }

    if (tab === 'sent') {
      return this.sentTrades();
    }

    const ownedTeamIds = new Set(this.ownedTeamIds());
    return this.proposals().filter(
      trade =>
        trade.status !== 'PENDING' &&
        (ownedTeamIds.has(trade.proposingTeamId) ||
          ownedTeamIds.has(trade.receivingTeamId)),
    );
  });

  ngOnInit(): void {
    if(this.leagueId === null){
      this.tradeService
        .getUserTeams()
        .subscribe({
          next: (teams) => this.userTeamIds.set(teams.map(team => team.id)),
          error: (error) => {
            console.error('Errore nel caricamento dei team utente:', error);
            this.loadError.set('Impossibile caricare i tuoi team.');
          },
        });

      this.tradeService.getUserTrades()
      .subscribe({
          next: (trades) => this._proposals.set(trades),
          error: (error) => {
            console.error('Errore nel caricamento degli scambi:', error);
            this.loadError.set('Impossibile caricare gli scambi.');
          },
      });

    }else{
      this.tradeService
        .getLeague(this.leagueId)
        .subscribe({
          next: (league) => this.leagueName.set(league.name),
          error: (error) => {
            console.error('Errore nel caricamento della lega:', error);
            this.loadError.set('Impossibile caricare la lega.');
          },
        });

      this.tradeService
        .getLeagueTrades(this.leagueId)
        .subscribe({
          next: (trades) => this._proposals.set(trades),
          error: (error) => {
            console.error('Errore nel caricamento degli scambi:', error);
            this.loadError.set('Impossibile caricare gli scambi.');
          },
      });

      this.tradeService
        .getLeagueTeams(this.leagueId)
        .subscribe({
            next: (teams) => this.leagueTeams.set(teams),
            error: (error) => {
              console.error('Errore nel caricamento dei team', error);
              this.loadError.set('Impossibile caricare i team.');
            },
      });
    }

    
  }

  selectTab(tab: TradeTab): void {
    this.activeTab.set(tab);
  }

  submitProposal(event: SubmitEvent): void {
    event.preventDefault();

    this.tradeService.createTrade(this.newProposal());
  }
}
