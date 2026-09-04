import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

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

    protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.registerForm().invalid()) {
      this.registerForm().markAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // TODO: sostituire con la chiamata ad AuthApiService (POST /api/auth/register)
    console.log('Registration da inviare al backend:', this.credentials());
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
