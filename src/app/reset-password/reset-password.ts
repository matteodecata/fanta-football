import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form, minLength, required, validate } from '@angular/forms/signals';

interface ResetPasswordFormValue {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Component({
  selector: 'app-reset-password',
  imports: [FormField, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly tokenInput = viewChild<ElementRef<HTMLInputElement>>('tokenInput');
  private readonly newPasswordInput = viewChild<ElementRef<HTMLInputElement>>('newPasswordInput');
  private readonly confirmNewPasswordInput = viewChild<ElementRef<HTMLInputElement>>(
    'confirmNewPasswordInput',
  );

  // TODO: quando colleghiamo il routing, precompilare "token" leggendo il query param del link ricevuto via email
  protected readonly resetData = signal<ResetPasswordFormValue>({
    token: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  protected readonly resetForm = form(this.resetData, (path) => {
    required(path.token, { message: 'Inserisci il codice di reimpostazione' });

    required(path.newPassword, { message: 'Inserisci la nuova password' });
    // minLength, come required/email, è un validatore "pronto all'uso": basta indicare il numero minimo
    // di caratteri. Il valore 8 è una scelta lato client, da confermare con le regole reali del backend.
    minLength(path.newPassword, 8, { message: 'La password deve avere almeno 8 caratteri' });

    required(path.confirmNewPassword, { message: 'Conferma la nuova password' });
    // validate() serve quando la regola non è "pronta all'uso": qui confrontiamo due campi tra loro.
    // - value() legge il valore del campo su cui è applicato il validatore (confirmNewPassword);
    // - valueOf(altroPath) legge il valore di un altro campo del form (newPassword);
    // - si ritorna un oggetto errore {kind, message} se non valido, oppure null se valido.
    // È reattivo: se l'utente modifica newPassword dopo aver già scritto confirmNewPassword,
    // questo controllo si rilancia da solo e l'errore compare/scompare di conseguenza.
    validate(path.confirmNewPassword, ({ value, valueOf }) => {
      if (value() !== valueOf(path.newPassword)) {
        return { kind: 'passwordMismatch', message: 'Le password non coincidono' };
      }
      return null;
    });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.resetForm().invalid()) {
      this.resetForm().markAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // TODO: sostituire con la chiamata ad AuthApiService (POST /api/auth/reset-password)
    console.log('Reset password da inviare al backend:', this.resetData());
  }

  private focusFirstInvalidField(): void {
    if (this.resetForm.token().invalid()) {
      this.tokenInput()?.nativeElement.focus();
    } else if (this.resetForm.newPassword().invalid()) {
      this.newPasswordInput()?.nativeElement.focus();
    } else if (this.resetForm.confirmNewPassword().invalid()) {
      this.confirmNewPasswordInput()?.nativeElement.focus();
    }
  }
}
