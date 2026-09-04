import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  ChangePasswordRequest,
  ChangePasswordService,
} from './change-password.service';

interface ChangePasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-change-password',
  imports: [FormField, FormRoot],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  private readonly changePasswordService = inject(ChangePasswordService);
  private readonly router = inject(Router);

  protected readonly passwordModel = signal<ChangePasswordModel>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly passwordForm = form(
    this.passwordModel,
    (fieldPath) => {
      required(fieldPath.currentPassword, {
        message: 'Inserisci la password attuale.',
      });

      required(fieldPath.newPassword, {
        message: 'Inserisci la nuova password.',
      });
      minLength(fieldPath.newPassword, 12, {
        message: 'La nuova password deve contenere almeno 12 caratteri.',
      });
      maxLength(fieldPath.newPassword, 64, {
        message: 'La nuova password non può superare i 64 caratteri.',
      });
      validate(fieldPath.newPassword, ({ value }) => {
        const password = value();

        if (password.length === 0) {
          return null;
        }

        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialCharacter = /[^a-zA-Z0-9]/.test(password);

        if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecialCharacter) {
          return {
            kind: 'passwordComplexity',
            message:
              'Usa almeno una maiuscola, una minuscola, un numero e un carattere speciale.',
          };
        }

        return null;
      });
      validate(fieldPath.newPassword, ({ value }) => {
        const newPassword = value();
        const currentPassword = this.passwordModel().currentPassword;

        if (newPassword.length > 0 && newPassword === currentPassword) {
          return {
            kind: 'unchangedPassword',
            message: 'La nuova password deve essere diversa da quella attuale.',
          };
        }

        return null;
      });

      required(fieldPath.confirmPassword, {
        message: 'Conferma la nuova password.',
      });
      validate(fieldPath.confirmPassword, ({ value }) => {
        const confirmation = value();
        const newPassword = this.passwordModel().newPassword;

        if (confirmation.length > 0 && confirmation !== newPassword) {
          return {
            kind: 'passwordMismatch',
            message: 'Le password non coincidono.',
          };
        }

        return null;
      });
    },
    {
      submission: {
        action: async (formField) => {
          const formValue = formField().value();
          const request: ChangePasswordRequest = {
            currentPassword: formValue.currentPassword,
            newPassword: formValue.newPassword,
          };

          try {
            await firstValueFrom(this.changePasswordService.changePassword(request));

            // Clear the local session here once the authentication service exists.
            await this.router.navigate(['/login'], {
              state: {
                message: 'Password modificata. Accedi utilizzando la nuova password.',
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

            if (error.status === 422) {
              return {
                kind: 'invalidPassword',
                message: 'La nuova password non rispetta i requisiti di sicurezza.',
                fieldTree: formField.newPassword,
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
              message: 'Non è stato possibile modificare la password. Riprova.',
            };
          }
        },
      },
    },
  );
}
