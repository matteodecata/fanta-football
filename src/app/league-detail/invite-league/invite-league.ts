import { Component, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { InviteLeagueRequest } from '../league-detail.models';

@Component({
  selector: 'app-invite-league',
  imports: [FormField],
  templateUrl: './invite-league.html',
  styleUrl: './invite-league.css',
})
export class InviteLeague {
  private readonly http = inject(HttpClient);

  leagueId = input.required<number>();

  protected readonly model = signal<InviteLeagueRequest>({
    username: '',
  });

  protected readonly inviteForm = form(this.model, (path) => {
    required(path.username, { message: 'Il nome utente è obbligatorio' });
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    await submit(this.inviteForm, async () => {
      const id = this.leagueId();
      await firstValueFrom(
        this.http.post(`/api/leagues/${id}/invites`, { username: this.model().username })
      );
    });
  }
}
