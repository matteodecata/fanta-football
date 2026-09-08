import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InviteLeague } from './invite-league';

describe('InviteLeague', () => {
  it('invia lo username ripulito con il campo richiesto dal backend e mostra conferma', async () => {
    TestBed.configureTestingModule({
      imports: [InviteLeague],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(InviteLeague);
    fixture.componentRef.setInput('leagueId', 7);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const input = page.querySelector('input')!;
    input.value = '  mario  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    page.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => {
      const request = http.expectOne('/api/leagues/7/invites');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ invitedUsername: 'mario' });
      request.flush({ id: 21, status: 'PENDING' });
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Invito inviato.');
    expect(input.value).toBe('');
    http.verify();
  });

  it('non invia uno username composto soltanto da spazi', async () => {
    TestBed.configureTestingModule({
      imports: [InviteLeague],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(InviteLeague);
    fixture.componentRef.setInput('leagueId', 7);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const input = page.querySelector('input')!;
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    page.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    TestBed.inject(HttpTestingController).expectNone('/api/leagues/7/invites');
  });
});
