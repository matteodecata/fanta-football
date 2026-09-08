import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Session } from '../core/auth/session';
import { ChangePassword } from './change-password/change-password';
import { ChangeUsername } from './change-username/change-username';
import { DisableAccount } from './disable-account/disable-account';

@Component({
  selector: 'app-account',
  imports: [RouterLink, ChangeUsername, ChangePassword, DisableAccount],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected logout(): void {
    this.session.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
