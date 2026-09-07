import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  required,
  validate,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  DisableAccountRequest,
  DisableAccountService,
} from './disable-account.service';

interface DisableAccountModel {
  currentPassword: string;
  confirmation: string;
}

const TOKEN_STORAGE_KEY = 'fanta-football-token';

@Component({
  selector: 'app-disable-account',
  imports: [FormField, FormRoot],
  templateUrl: './disable-account.html',
  styleUrl: './disable-account.css',
})
export class DisableAccount {
  private readonly disableAccountService = inject(DisableAccountService);
  private readonly router = inject(Router);

  protected readonly confirmationWord = 'DISATTIVA';

  protected readonly disableAccountModel = signal<DisableAccountModel>({
    currentPassword: '',
    confirmation: '',
  });

  protected readonly disableAccountForm = form(
    this.disableAccountModel,
    (fieldPath) => {
      required(fieldPath.currentPassword, {
        message: 'Inserisci la password attuale.',
      });

      required(fieldPath.confirmation, {
        message: 'Inserisci la parola di conferma.',
      });
      validate(fieldPath.confirmation, ({ value }) => {
        const confirmation = value().trim();

        if (confirmation.length > 0 && confirmation !== this.confirmationWord) {
          return {
            kind: 'invalidConfirmation',
            message: `Per confermare, scrivi ${this.confirmationWord}.`,
          };
        }

        return null;
      });
    },
    {
      submission: {
        action: async (formField) => {
          const request: DisableAccountRequest = {
            currentPassword: formField().value().currentPassword,
          };

          try {
            await firstValueFrom(this.disableAccountService.disableAccount(request));

            sessionStorage.removeItem(TOKEN_STORAGE_KEY);

            await this.router.navigate(['/login'], {
              state: {
                message: 'Il tuo account è stato disattivato.',
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
              sessionStorage.removeItem(TOKEN_STORAGE_KEY);

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

            if (error.status === 429) {
              return {
                kind: 'tooManyRequests',
                message: 'Hai effettuato troppi tentativi. Riprova più tardi.',
              };
            }

            return {
              kind: 'serverError',
              message: 'Non è stato possibile disattivare l’account. Riprova.',
            };
          }
        },
      },
    },
  );
}
