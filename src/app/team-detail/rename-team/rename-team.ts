import { Component, inject, input, output, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { TeamDetailService } from '../team-detail.service';
import { RenameTeamRequest } from '../team-detail.models';

@Component({
  selector: 'app-rename-team',
  imports: [FormField],
  templateUrl: './rename-team.html',
  styleUrl: './rename-team.css',
})
export class RenameTeam {
  private readonly teamDetailService = inject(TeamDetailService);

  teamId = input.required<number>();
  updated = output<void>();

  protected readonly model = signal<RenameTeamRequest>({
    name: '',
  });

  protected readonly renameForm = form(this.model, (path) => {
    required(path.name, { message: 'Il nome della squadra è obbligatorio' });
  });

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitSuccess = signal<string | null>(null);

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitError.set(null);
    this.submitSuccess.set(null);

    await submit(this.renameForm, async () => {
      this.isSubmitting.set(true);

      try {
        await firstValueFrom(this.teamDetailService.renameTeam(this.teamId(), this.model()));
        this.submitSuccess.set('Nome squadra aggiornato.');
        this.updated.emit();
      } catch (error) {
        this.submitError.set('Non è stato possibile rinominare la squadra.');
        console.error('Errore durante la rinomina della squadra:', error);
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }
}
