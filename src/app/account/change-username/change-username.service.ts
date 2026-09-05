import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChangeUsernameRequest {
  newUsername: string;
  currentPassword: string;
}

@Service()
export class ChangeUsernameService {
  private readonly http = inject(HttpClient);

  changeUsername(request: ChangeUsernameRequest): Observable<void> {
    return this.http.patch<void>('/api/account/me/username', request);
  }
}
