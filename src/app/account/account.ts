import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChangePassword } from './change-password/change-password';
import { ChangeUsername } from './change-username/change-username';
import { DisableAccount } from './disable-account/disable-account';

@Component({
  selector: 'app-account',
  imports: [RouterLink, ChangeUsername, ChangePassword, DisableAccount],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {}
