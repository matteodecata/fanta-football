import { Component, inject, signal } from '@angular/core';
import { form, min, required, submit, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { CreateAdminTeam } from './create-admin-team/create-admin-team';
import { LeaguesApiService } from './leagues-api.service';
import { CreateLeagueRequest } from './league-create.models';

@Component({
  selector: 'app-league-create',
  imports: [FormField, CreateAdminTeam],
  templateUrl: './league-create.html',
  styleUrl: './league-create.css',
})
export class LeagueCreate {
  private readonly leaguesApi = inject(LeaguesApiService);

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitSuccess = signal<string | null>(null);

  protected readonly model = signal<CreateLeagueRequest>({
    name: '',
    teamName: '',
    budget: 500,
  });

  protected readonly leagueForm = form(this.model, (path) => {
    required(path.name, { message: 'Il nome della lega è obbligatorio' });
    required(path.teamName, { message: 'Il nome della squadra è obbligatorio' });
    min(path.budget, 1, { message: 'Il budget deve essere maggiore di zero' });
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitError.set(null);
    this.submitSuccess.set(null);

    await submit(this.leagueForm, async () => {
      this.isSubmitting.set(true);

      try {
        const league = await firstValueFrom(this.leaguesApi.createLeague(this.model()));
        this.submitSuccess.set(`Lega creata con successo: ${league.name}`);
        console.log('Lega creata:', league);
      } catch (error) {
        this.submitError.set('Non è stato possibile creare la lega. Riprova più tardi.');
        console.error('Errore durante la creazione della lega:', error);
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }
}

