import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InviteLeague } from './invite-league/invite-league';
import { Standings } from './standings/standings';

@Component({
  selector: 'app-league-detail',
  imports: [RouterLink, Standings, InviteLeague],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  private readonly route = inject(ActivatedRoute);

  protected readonly leagueId = Number(this.route.snapshot.paramMap.get('leagueId'));
}
