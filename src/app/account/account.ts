import { Component } from '@angular/core';
import { ChangePassword } from './change-password/change-password';
import { ChangeUsername } from './change-username/change-username';
import { DisableAccount } from './disable-account/disable-account';

@Component({
  selector: 'app-account',
  imports: [ChangeUsername, ChangePassword, DisableAccount],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {}
