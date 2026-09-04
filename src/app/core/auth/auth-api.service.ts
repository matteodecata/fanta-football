import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserRequest, ForgotPasswordRequest, LoginRequest, LoginResponse, ResetPasswordRequest, UserDto } from '../models/auth.models';

// `@Service()` è l'equivalente più corto di `@Injectable({ providedIn: 'root' })`
// (autoProvided è true di default): CLAUDE.md lo preferisce per Angular v22+.
@Service()
export class AuthApiService {
  private readonly http = inject(HttpClient);

  // Path base per non ripetere '/api/auth' in ogni metodo (PROJECT_CONTEXT.md,
  // sezione 5, punto 3: centralizzare il base path API).
  private readonly basePath = '/api/auth';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.basePath}/login`, credentials);
  }

  register(credentials: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.basePath}/register`, credentials)
  }

  requestPasswordReset(credentials: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.basePath}/forgot-password`, credentials)
  }

  confirmPasswordReset(credentials: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.basePath}/reset-password`, credentials)
  }
}
