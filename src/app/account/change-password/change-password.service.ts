import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Service()
export class ChangePasswordService {
  private readonly http = inject(HttpClient);

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>('/api/account/me/password', request);
  }
}
