import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { email, form, FormField, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../core/auth/auth-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { extractApiError } from '../core/http/api-error';


interface RegisterFormValue {
  username: string,
  email: string,
  password: string
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordRequirements(password: string): readonly PasswordRequirement[] {
  const normalizedPassword = password.toLowerCase();

  return [
    { label: 'Min. 12 caratteri', met: password.length >= 12 },
    { label: '1 minuscola', met: /[a-z]/.test(password) },
    { label: '1 maiuscola', met: /[A-Z]/.test(password) },
    { label: '1 cifra', met: /[0-9]/.test(password) },
    { label: '1 carattere speciale', met: /[^a-zA-Z0-9]/.test(password) },
    {
      label: 'Password non comune',
      met: !['password', 'password123', 'qwerty', 'admin', 'letmein'].includes(normalizedPassword),
    },
  ];
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
  protected readonly passwordVisible = signal(false);
  protected readonly passwordFocused = signal(false);
  protected readonly passwordRequirements = computed(() => getPasswordRequirements(this.credentials().password));

  protected readonly registerForm = form(this.credentials, (path) => {
    required(path.username, {message: 'Inserisci username'});
    required(path.email, {message: 'Inserisci email'});
    // required() controlla solo che il campo non sia vuoto: email() in più verifica il formato
    // (accetta "a@b.it", rifiuta "a@b" o "@b.it"). Si possono applicare più validatori sullo stesso path.
    email(path.email, {message: 'Inserisci un email valido'})
    required(path.password, {message: 'Inserisci password'});
    validate(path.password, ({ value }) => {
      const requirements = getPasswordRequirements(value());
      return requirements.every((requirement) => requirement.met)
        ? undefined
        : { kind: 'passwordRequirements', message: 'La password non soddisfa tutti i requisiti' };
    });
  })


  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

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
