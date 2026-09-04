import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface DisableAccountRequest {
  currentPassword: string;
}

export interface DisableAccountResponse {
  message: string;
}

@Service()
export class DisableAccountService {
  private readonly http = inject(HttpClient);

  disableAccount(
    request: DisableAccountRequest,
  ): Observable<DisableAccountResponse> {
    return this.http.patch<DisableAccountResponse>('/api/account/disable', request);
  }
}
