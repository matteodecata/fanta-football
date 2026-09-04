import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CalendarComponent } from '../calendar/calendar.component';
import { SessionService } from '../auth/session.service';

@Component({
  selector: 'app-league-detail',
  imports: [CalendarComponent],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);
  readonly leagueId = Number(this.route.snapshot.paramMap.get('leagueId'));
  readonly isAdmin = computed(() => this.session.hasRole('ADMIN'));
}
