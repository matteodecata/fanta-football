import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { LeagueStandingResponse } from '../league-detail.models';

@Component({
  selector: 'app-standings',
  imports: [],
  templateUrl: './standings.html',
  styleUrl: './standings.css',
})
export class Standings {
  leagueId = input.required<number>();

  protected readonly standingsResource = httpResource<LeagueStandingResponse[]>(() => {
    const id = this.leagueId();

    if (!id || Number.isNaN(id)) {
      return undefined;
    }

    return {
      url: `/api/leagues/${id}/standings`,
      method: 'GET',
    };
  });

  protected readonly standings = this.standingsResource.value;
}
