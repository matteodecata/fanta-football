import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PendingInvites } from './pending-invites/pending-invites';
import { UserLeagues } from './user-leagues/user-leagues';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, PendingInvites, UserLeagues],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
