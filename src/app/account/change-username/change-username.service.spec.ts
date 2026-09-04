import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ChangeUsernameService } from './change-username.service';

describe('ChangeUsernameService', () => {
  let service: ChangeUsernameService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChangeUsernameService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ChangeUsernameService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('invia la richiesta di modifica username', () => {
    const request = {
      newUsername: 'nuovo_username',
      currentPassword: 'Password-attuale1!',
    };
    const next = vi.fn();

    service.changeUsername(request).subscribe(next);

    const httpRequest = httpTesting.expectOne('/api/account/me/username');
    expect(httpRequest.request.method).toBe('PATCH');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(null);
    expect(next).toHaveBeenCalledOnce();
  });

  it('propaga un errore restituito dal backend', () => {
    const error = vi.fn();

    service
      .changeUsername({
        newUsername: 'username_esistente',
        currentPassword: 'Password-attuale1!',
      })
      .subscribe({ error });

    httpTesting
      .expectOne('/api/account/me/username')
      .flush({ message: 'Username già utilizzato' }, { status: 409, statusText: 'Conflict' });

    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0][0].status).toBe(409);
  });
});
