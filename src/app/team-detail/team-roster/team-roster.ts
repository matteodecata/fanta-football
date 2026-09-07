import { Component, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { TeamPlayerResponse } from '../team-detail.models';
import { PlayerRelease } from '../player-release/player-release';

@Component({
  selector: 'app-team-roster',
  imports: [PlayerRelease],
  templateUrl: './team-roster.html',
  styleUrl: './team-roster.css',
})
export class TeamRoster {
  teamId = input.required<number>();
  private readonly refreshToken = signal(0);

  protected readonly rosterResource = httpResource<TeamPlayerResponse[]>(() => {
    const id = this.teamId();

    if (!id || Number.isNaN(id)) {
      return undefined;
    }

    return {
      url: `/api/teams/${id}/players?_=${this.refreshToken()}`,
      method: 'GET',
    };
  });

  protected readonly roster = this.rosterResource.value;

  protected refreshRoster(): void {
    this.refreshToken.update((value) => value + 1);
  }
}
