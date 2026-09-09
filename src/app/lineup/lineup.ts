import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TeamsApiService } from '../teams/teams-api.service';
import { PlayerRole } from '../players/players-response';
import { LineupService } from './lineup.service';
import { LineupPlayerRequest, LineupRequest, LineupResponse, LineupTypeResponse } from './lineup.models';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  imports: [],
  selector: 'app-lineup',
  styleUrl: './lineup.css',
  templateUrl: './lineup.html',
})
export class Lineup {
  private readonly route = inject(ActivatedRoute);
  private readonly teamsApi = inject(TeamsApiService);
  private readonly lineupApi = inject(LineupService);

  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly teamId = computed(() => Number(this.params().get('teamId')));
  protected readonly leagueMatchId = computed(() => Number(this.params().get('leagueMatchId')));
  // Il Calendario conosce già matchdayClosed per ogni partita (sezione 14 di
  // PROJECT_CONTEXT.md): arriva qui come query param nel link verso questa
  // pagina, non serve rifare una chiamata solo per leggere questo flag.
  protected readonly matchdayClosed = computed(() => this.query().get('closed') === 'true');

  protected readonly rosterResource = this.teamsApi.roster(this.teamId);
  private readonly playersResource = this.teamsApi.players();

  // Il portiere è sempre 1, implicito: non va scelto (sezione 8 di
  // PROJECT_CONTEXT.md), quindi viene escluso dalla selezione titolari/panchina.
  protected readonly selectableRoster = computed(() => {
    const roles = new Map((this.playersResource.hasValue() ? this.playersResource.value() : []).map((player) => [player.id, player.role]));
    return (this.rosterResource.hasValue() ? this.rosterResource.value() : [])
      .filter((player) => player.transferDate === null)
      .map((player) => ({ ...player, role: roles.get(player.playerId) }))
      .filter((player): player is typeof player & { role: Exclude<PlayerRole, 'P'> } => player.role !== undefined && player.role !== 'P');
  });

  // La squadra deve avere almeno un giocatore selezionabile (esclusi portiere
  // e svincolati) prima di poter anche solo scegliere un modulo: altrimenti
  // nessun modulo sarebbe comunque completabile.
  protected readonly hasRoster = computed(() => this.selectableRoster().length > 0);

  protected readonly lineupTypes = signal<LineupTypeResponse[]>([]);
  protected readonly lineupTypesStatus = signal<LoadStatus>('idle');

  protected readonly existingLineup = signal<LineupResponse | null>(null);
  protected readonly lineupStatus = signal<LoadStatus>('idle');

  protected readonly selectedLineupTypeId = signal<number | null>(null);
  protected readonly starterTeamPlayerIds = signal<Set<number>>(new Set());

  protected readonly saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  protected readonly errorMessage = signal('');

  protected readonly selectedLineupType = computed(
    () => this.lineupTypes().find((type) => type.id === this.selectedLineupTypeId()) ?? null,
  );

  // Conteggio titolari selezionati per ruolo, da confrontare con
  // defenderNum/midfielderNum/forwardNum del modulo scelto prima di inviare.
  protected readonly starterCountByRole = computed(() => {
    const starters = this.starterTeamPlayerIds();
    const counts: Record<Exclude<PlayerRole, 'P'>, number> = { D: 0, C: 0, A: 0 };
    for (const player of this.selectableRoster()) {
      if (starters.has(player.id)) counts[player.role]++;
    }
    return counts;
  });

  // Il bonus "difensiva" lo assegna comunque il backend, ma è comodo
  // mostrarlo subito in UI: è true solo con 5 difensori titolari.
  protected readonly defensive = computed(() => this.starterCountByRole().D === 5);

  protected readonly isStarterCountValid = computed(() => {
    const type = this.selectedLineupType();
    if (!type) return false;
    const counts = this.starterCountByRole();
    return counts.D === type.defenderNum && counts.C === type.midfielderNum && counts.A === type.forwardNum;
  });

  constructor() {
    this.loadLineupTypes();
    effect(() => this.loadExistingLineup(this.teamId(), this.leagueMatchId()));
  }

  private loadLineupTypes(): void {
    this.lineupTypesStatus.set('loading');
    this.lineupApi.getLineupTypes().subscribe({
      next: (types) => {
        this.lineupTypes.set(types);
        this.lineupTypesStatus.set('ready');
      },
      error: () => this.lineupTypesStatus.set('error'),
    });
  }

  private loadExistingLineup(teamId: number, leagueMatchId: number): void {
    if (!Number.isInteger(teamId) || !Number.isInteger(leagueMatchId)) return;

    this.lineupStatus.set('loading');
    this.lineupApi.getLineup(teamId, leagueMatchId).subscribe({
      next: (lineup) => {
        this.existingLineup.set(lineup);
        this.selectedLineupTypeId.set(lineup?.lineupTypeId ?? null);
        this.starterTeamPlayerIds.set(new Set(lineup?.players.filter((player) => player.starter).map((player) => player.teamPlayerId) ?? []));
        this.lineupStatus.set('ready');
      },
      error: () => this.lineupStatus.set('error'),
    });
  }

  protected selectLineupType(lineupTypeId: number): void {
    if (this.matchdayClosed()) return;
    this.selectedLineupTypeId.set(lineupTypeId);
    this.saveStatus.set('idle');
  }

  protected toggleStarter(teamPlayerId: number): void {
    if (this.matchdayClosed()) return;
    this.starterTeamPlayerIds.update((current) => {
      const next = new Set(current);
      if (next.has(teamPlayerId)) next.delete(teamPlayerId);
      else next.add(teamPlayerId);
      return next;
    });
    this.saveStatus.set('idle');
  }

  protected submit(): void {
    const lineupTypeId = this.selectedLineupTypeId();
    if (lineupTypeId === null || this.matchdayClosed() || this.saveStatus() === 'saving' || !this.isStarterCountValid()) return;

    const starters = this.starterTeamPlayerIds();
    const players: LineupPlayerRequest[] = this.selectableRoster().map((player) => ({
      teamPlayerId: player.id,
      starter: starters.has(player.id),
    }));

    const request: LineupRequest = {
      lineupTypeId,
      defensive: this.defensive(),
      players,
    };

    this.saveStatus.set('saving');
    this.errorMessage.set('');
    const teamId = this.teamId();
    const leagueMatchId = this.leagueMatchId();
    const save$ = this.existingLineup()
      ? this.lineupApi.updateLineup(teamId, leagueMatchId, request)
      : this.lineupApi.createLineup(teamId, leagueMatchId, request);

    save$.subscribe({
      next: (lineup) => {
        this.existingLineup.set(lineup);
        this.saveStatus.set('saved');
      },
      error: () => {
        this.saveStatus.set('error');
        this.errorMessage.set('Non è stato possibile salvare la formazione. Riprova più tardi.');
      },
    });
  }
}
