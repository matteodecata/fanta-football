import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PendingInvites } from './pending-invites';

describe('PendingInvites', () => {
  for (const decision of ['ACCEPTED', 'DECLINED'] as const) {
    it(`salva ${decision} prima di aggiornare gli inviti o navigare`, async () => {
      TestBed.configureTestingModule({
        imports: [PendingInvites],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      });
      const http = TestBed.inject(HttpTestingController);
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const fixture = TestBed.createComponent(PendingInvites);
      fixture.detectChanges();
      http.expectOne('/api/invites/pending').flush([{
        id: 21, leagueId: 9, invitedByUserId: 4, invitedUserId: 3,
        status: 'PENDING', sentDate: '2026-09-04T10:00:00Z', responseDate: null,
      }]);
      await fixture.whenStable();
      fixture.detectChanges();
      const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.invite-actions button');
      buttons[decision === 'ACCEPTED' ? 0 : 1].click();
      fixture.detectChanges();
      expect(buttons[0].disabled).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
      const request = http.expectOne('/api/invites/21');
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ status: decision });
      request.flush({ id: 21, status: decision });
      await vi.waitFor(() => {
        TestBed.tick();
        http.expectOne('/api/invites/pending').flush([]);
      });
      await fixture.whenStable();
      fixture.detectChanges();
      if (decision === 'ACCEPTED') {
        expect(navigate).toHaveBeenCalledWith(['/leagues', 9, 'team', 'new']);
      } else {
        expect(navigate).not.toHaveBeenCalled();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nessun invito in sospeso');
      }
      http.verify();
    });
  }
});
