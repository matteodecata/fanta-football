import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form, required } from '@angular/forms/signals';

// Definizione dell'interfaccia per l'utilizzo per della form
interface LoginFormValue {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly usernameInput = viewChild<ElementRef<HTMLInputElement>>('usernameInput');
  private readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');

  // modello da passare x la form
  protected readonly credentials = signal<LoginFormValue>({ username: '', password: '' });

  protected readonly loginForm = form(this.credentials, (path) => {
    // per fare login devono essere campi required
    required(path.username, { message: 'Inserisci il nome utente' });
    required(path.password, { message: 'Inserisci la password' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.loginForm().invalid()) {
      this.loginForm().markAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // TODO: sostituire con la chiamata ad AuthApiService (POST /api/auth/login)
    console.log('Login da inviare al backend:', this.credentials());
  }

  private focusFirstInvalidField(): void {
    if (this.loginForm.username().invalid()) {
      this.usernameInput()?.nativeElement.focus();
    } else if (this.loginForm.password().invalid()) {
      this.passwordInput()?.nativeElement.focus();
    }
  }
}
