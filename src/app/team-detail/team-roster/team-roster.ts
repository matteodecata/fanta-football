import { Component, computed, inject, input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TeamsApiService } from '../../teams/teams-api.service';
import { PlayerRelease } from '../player-release/player-release';
import { PlayerRole } from '../../players/players-response';

const ROLE_LABELS: Record<PlayerRole, string> = { P: 'Portiere', D: 'Difensore', C: 'Centrocampista', A: 'Attaccante' };

@Component({
  selector: 'app-team-roster',
  imports: [PlayerRelease],
  templateUrl: './team-roster.html',
  styleUrl: './team-roster.css',
})
export class TeamRoster {
  readonly teamId = input.required<number>();
  readonly canManage = input(false);
  private readonly api = inject(TeamsApiService);
  protected readonly rosterResource = this.api.roster(this.teamId);
  protected readonly forbidden = computed(() => {
    const error = this.rosterResource.error();
    return error instanceof HttpErrorResponse && error.status === 403;
  });
  // Dal 10 settembre 2026 TeamPlayerResponse include già `role`: non serve
  // più incrociarlo con l'intero catalogo `/api/players` (che nel frattempo
  // è anche diventato paginato, rendendo quell'incrocio pure inaffidabile).
  protected readonly roster = computed(() => {
    return (this.rosterResource.hasValue() ? this.rosterResource.value() : [])
      .filter(player => player.transferDate === null)
      .map(player => ({ ...player, roleLabel: ROLE_LABELS[player.playerRole] ?? 'Non disponibile' }));
  });

  protected refreshRoster(): void { this.rosterResource.reload(); }
}
