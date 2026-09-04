import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Session } from './session.service';

export interface LoginRequest { readonly username: string; readonly password: string; }

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<Session> {
    return this.http.post<Session>('/api/auth/login', request);
  }
}
