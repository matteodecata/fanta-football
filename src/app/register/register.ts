import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../core/auth/auth-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { extractApiError } from '../core/http/api-error';


interface RegisterFormValue {
  username: string,
  email: string,
  password: string
}

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  private readonly usernameInput = viewChild<ElementRef<HTMLInputElement>>('usernameInput');
  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  private readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');

  protected readonly credentials = signal<RegisterFormValue>({username: '', email: '', password: ''})

  protected readonly registerForm = form(this.credentials, (path) => {
    required(path.username, {message: 'Inserisci username'});
    required(path.email, {message: 'Inserisci email'});
    // required() controlla solo che il campo non sia vuoto: email() in più verifica il formato
    // (accetta "a@b.it", rifiuta "a@b" o "@b.it"). Si possono applicare più validatori sullo stesso path.
    email(path.email, {message: 'Inserisci un email valido'})
    required(path.password, {message: 'Inserisci password'});
  })


  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

    protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.registerForm().invalid()) {
      this.registerForm().markAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.authApi.register(this.credentials()).subscribe({
      next:() =>{
          this.submitting.set(false);
          this.router.navigateByUrl('/login');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(extractApiError(err)?.message ?? 'Registrazione non avvenuta')
      },
    });

    
  }

  private focusFirstInvalidField(): void {
    if (this.registerForm.username().invalid()) {
      this.usernameInput()?.nativeElement.focus();
    } else if (this.registerForm.email().invalid()){
      this.emailInput()?.nativeElement.focus();
    }else if (this.registerForm.password().invalid()) {
      this.passwordInput()?.nativeElement.focus();
    } 
  }
}
