import { afterNextRender, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { InviteLeagueRequest } from '../league-detail.models';
import { InviteLeagueService } from './invite-league.service';
import { extractApiError } from '../../core/http/api-error';

@Component({
  selector: 'app-invite-league',
  imports: [FormField],
  templateUrl: './invite-league.html',
  styleUrl: './invite-league.css',
})
export class InviteLeague {
  private readonly api = inject(InviteLeagueService);
  private readonly usernameInput = viewChild<ElementRef<HTMLInputElement>>('usernameInput');

  constructor() {
    afterNextRender(() => this.usernameInput()?.nativeElement.focus());
  }

  leagueId = input.required<number>();

  protected readonly model = signal<InviteLeagueRequest>({
    username: '',
  });

  protected readonly inviteForm = form(this.model, (path) => {
    required(path.username, { message: 'Il nome utente è obbligatorio' });
    validate(path.username, ({ value }) => value().trim().length === 0
      ? { kind: 'blankUsername', message: 'Inserisci uno username valido.' } : null);
  });

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitSuccess = signal<string | null>(null);

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;
    if (this.inviteForm().invalid()) {
      this.inviteForm().markAsTouched();
      this.usernameInput()?.nativeElement.focus();
      return;
    }
    this.submitError.set(null);
    this.submitSuccess.set(null);

    await submit(this.inviteForm, async () => {
      this.isSubmitting.set(true);

      try {
        const id = this.leagueId();
        await firstValueFrom(
          this.api.invite(id, this.model().username.trim())
        );

        this.submitSuccess.set('Invito inviato. L’utente lo troverà nella dashboard e potrà accettarlo o rifiutarlo.');
        this.model.set({ username: '' });
        this.inviteForm().reset();
      } catch (error: unknown) {
        this.submitError.set(error instanceof HttpErrorResponse
          ? extractApiError(error)?.message ?? (error.status === 404
            ? 'Utente o lega non trovato.' : error.status === 409
            ? 'L’utente è già membro oppure ha già un invito in attesa.' : error.status === 403
            ? 'Solo l’amministratore della lega può invitare membri.'
            : 'Non è stato possibile inviare l’invito. Riprova.')
          : 'Non è stato possibile inviare l’invito. Riprova.');
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }
}
