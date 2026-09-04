import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ChangePasswordService } from './change-password.service';

describe('ChangePasswordService', () => {
  let service: ChangePasswordService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChangePasswordService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ChangePasswordService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('invia la richiesta di modifica password', () => {
    const request = {
      currentPassword: 'Password-attuale1!',
      newPassword: 'Nuova-password2!',
    };
    const next = vi.fn();

    service.changePassword(request).subscribe(next);

    const httpRequest = httpTesting.expectOne('/api/account/me/password');
    expect(httpRequest.request.method).toBe('PUT');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(null);
    expect(next).toHaveBeenCalledOnce();
  });

  it('propaga un errore restituito dal backend', () => {
    const error = vi.fn();

    service
      .changePassword({
        currentPassword: 'Password-errata1!',
        newPassword: 'Nuova-password2!',
      })
      .subscribe({ error });

    httpTesting
      .expectOne('/api/account/me/password')
      .flush({ message: 'Password non corretta' }, { status: 403, statusText: 'Forbidden' });

    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0][0].status).toBe(403);
  });
});
