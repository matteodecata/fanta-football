import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CalendarComponent } from '../calendar/calendar.component';

@Component({
  selector: 'app-league-detail',
  imports: [CalendarComponent],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  private readonly route = inject(ActivatedRoute);
  readonly leagueId = Number(this.route.snapshot.paramMap.get('leagueId'));
}
