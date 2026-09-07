import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthApiService } from '../core/auth/auth-api.service';
import { Session } from '../core/auth/session';
import { extractApiError } from '../core/http/api-error';

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
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(Session);
  private readonly router = inject(Router);

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

  // Stati espliciti di caricamento/errore (PROJECT_CONTEXT.md sezione 3):
  // il template li userà per disabilitare il bottone durante la richiesta e
  // per mostrare un messaggio d'errore accessibile (aria-live).
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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

    this.errorMessage.set(null);
    this.submitting.set(true);

    // Il componente è il "chiamante" di cui parlavamo per AuthApiService: qui
    // decidiamo noi quando iscriverci (subscribe) e cosa fare nei due casi,
    // successo ed errore.
    this.authApi.login(this.credentials()).subscribe({
      next: (response) => {
        this.session.login(response);
        this.submitting.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        // Se il body ha la forma di un ApiError usiamo il messaggio del
        // backend, altrimenti (errore di rete, backend giù, ecc.) mostriamo
        // un messaggio generico invece di uno stack trace all'utente.
        this.errorMessage.set(extractApiError(err)?.message ?? 'Accesso non riuscito. Riprova.');
      },
    });
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
