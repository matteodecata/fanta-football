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
  // Riferimenti ai due <input> del template (via #usernameInput/#passwordInput),
  // servono solo per spostare il focus sul campo con errore dopo un submit non valido.
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
      // Il template mostra un errore solo se touched() è true (l'utente ha già interagito col campo).
      // Se l'utente clicca "Accedi" senza aver toccato nulla, markAsTouched() forza la visualizzazione
      // di tutti gli errori, altrimenti il form resterebbe invalido senza spiegare perché.
      this.loginForm().markAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // TODO: sostituire con la chiamata ad AuthApiService (POST /api/auth/login)
    console.log('Login da inviare al backend:', this.credentials());
  }

  // Sposta il focus sul primo campo non valido, nell'ordine in cui appaiono nel form:
  // utile per chi naviga da tastiera o con uno screen reader, che altrimenti non saprebbe
  // dove intervenire dopo un submit fallito.
  private focusFirstInvalidField(): void {
    if (this.loginForm.username().invalid()) {
      this.usernameInput()?.nativeElement.focus();
    } else if (this.loginForm.password().invalid()) {
      this.passwordInput()?.nativeElement.focus();
    }
  }
}
