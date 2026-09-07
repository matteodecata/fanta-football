import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, email, form, required } from '@angular/forms/signals';

interface ForgotPasswordFormValue {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  imports: [FormField, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  protected readonly requestData = signal<ForgotPasswordFormValue>({ email: '' });

  protected readonly forgotPasswordForm = form(this.requestData, (path) => {
    required(path.email, { message: 'Inserisci la tua email' });
    email(path.email, { message: 'Inserisci un indirizzo email valido' });
  });

  protected readonly requestSent = signal(false);

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.forgotPasswordForm().invalid()) {
      this.forgotPasswordForm().markAsTouched();
      this.emailInput()?.nativeElement.focus();
      return;
    }

    // TODO: sostituire con la chiamata ad AuthApiService (POST /api/auth/forgot-password)
    console.log('Richiesta reset password da inviare al backend:', this.requestData());

    // Il backend risponde sempre 204 indipendentemente dal fatto che l'email esista,
    // per non rivelare quali indirizzi sono registrati: mostriamo lo stesso messaggio in ogni caso.
    this.requestSent.set(true);
  }
}
