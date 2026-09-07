import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface DisableAccountRequest {
  currentPassword: string;
}

@Service()
export class DisableAccountService {
  private readonly http = inject(HttpClient);

  disableAccount(request: DisableAccountRequest): Observable<void> {
    return this.http.delete<void>('/api/account/me', {
      body: request,
    });
  }
}
