import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChangeUsernameRequest {
  newUsername: string;
  currentPassword: string;
}

export interface ChangeUsernameResponse {
  username: string;
  message: string;
}

@Service()
export class ChangeUsernameService {
  private readonly http = inject(HttpClient);

  changeUsername(
    request: ChangeUsernameRequest,
  ): Observable<ChangeUsernameResponse> {
    return this.http.patch<ChangeUsernameResponse>('/api/account/username', request);
  }
}
