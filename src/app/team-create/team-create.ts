import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TeamsApiService } from './teams-api.service';
import { CreateTeamRequest } from './team-create.models';

@Component({
  selector: 'app-team-create',
  imports: [FormField],
  templateUrl: './team-create.html',
  styleUrl: './team-create.css',
})
export class TeamCreate {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsApi = inject(TeamsApiService);

  protected readonly leagueId = Number(this.route.snapshot.paramMap.get('leagueId'));

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly model = signal<CreateTeamRequest>({
    teamName: '',
    leagueId: this.leagueId,
  });

  protected readonly teamForm = form(this.model, (path) => {
    required(path.teamName, { message: 'Il nome della squadra è obbligatorio' });
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitError.set(null);

    await submit(this.teamForm, async () => {
      this.isSubmitting.set(true);

      try {
        await firstValueFrom(this.teamsApi.createTeam(this.model()));
        await this.router.navigate(['/dashboard']);
      } catch (error) {
        this.submitError.set('Non è stato possibile creare la squadra.');
        console.error('Errore durante la creazione della squadra:', error);
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }
}

