import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ChangeUsernameService } from './change-username.service';

interface ChangeUsernameModel {
  newUsername: string;
  currentPassword: string;
}

@Component({
  selector: 'app-change-username',
  imports: [FormField, FormRoot],
  templateUrl: './change-username.html',
  styleUrl: './change-username.css',
})
export class ChangeUsername {
  private readonly changeUsernameService = inject(ChangeUsernameService);
  private readonly router = inject(Router);

  protected readonly usernameModel = signal<ChangeUsernameModel>({
    newUsername: '',
    currentPassword: '',
  });

  protected readonly usernameForm = form(
    this.usernameModel,
    (fieldPath) => {
      required(fieldPath.newUsername, {
        message: 'Inserisci il nuovo nome utente.',
      });
      minLength(fieldPath.newUsername, 3, {
        message: 'Il nome utente deve contenere almeno 3 caratteri.',
      });
      maxLength(fieldPath.newUsername, 20, {
        message: 'Il nome utente non può superare i 20 caratteri.',
      });
      pattern(fieldPath.newUsername, /^[a-zA-Z0-9_-]+$/, {
        message: 'Usa solamente lettere, numeri, trattini e trattini bassi.',
      });

      required(fieldPath.currentPassword, {
        message: 'Inserisci la password attuale.',
      });
    },
    {
      submission: {
        action: async (formField) => {
          const value = formField().value();
          const newUsername = value.newUsername.trim();

          try {
            await firstValueFrom(
              this.changeUsernameService.changeUsername({
                newUsername,
                currentPassword: value.currentPassword,
              }),
            );

            await this.router.navigate(['/login'], {
              state: {
                message: 'Nome utente modificato. Accedi con il nuovo nome utente.',
                username: newUsername,
              },
            });

            return;
          } catch (error: unknown) {
            if (!(error instanceof HttpErrorResponse)) {
              return {
                kind: 'unexpectedError',
                message: 'Si è verificato un errore imprevisto. Riprova.',
              };
            }

            if (error.status === 401) {
              await this.router.navigate(['/login'], {
                state: {
                  message: 'La sessione è scaduta. Accedi nuovamente.',
                },
              });

              return;
            }

            if (error.status === 403) {
              return {
                kind: 'incorrectPassword',
                message: 'La password attuale non è corretta.',
                fieldTree: formField.currentPassword,
              };
            }

            if (error.status === 409) {
              return {
                kind: 'usernameTaken',
                message: 'Questo nome utente è già utilizzato.',
                fieldTree: formField.newUsername,
              };
            }

            if (error.status === 429) {
              return {
                kind: 'tooManyRequests',
                message: 'Hai effettuato troppi tentativi. Riprova più tardi.',
              };
            }

            return {
              kind: 'serverError',
              message: 'Non è stato possibile modificare il nome utente. Riprova.',
            };
          }
        },
      },
    },
  );
}
