import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeagueStandingResponse } from '../league-detail.models';

@Component({
  selector: 'app-standings',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './standings.html',
  styleUrl: './standings.css',
})
export class Standings {
  readonly leagueId = input.required<number>();
  readonly teams = input.required<readonly LeagueStandingResponse[]>();
}
