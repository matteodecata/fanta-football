import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LeagueTrades } from './league-trades';
import { TradeDto } from '../../team-trades/team-trades.models';

describe('LeagueTrades', () => {
  const trade = (id: number, proposingTeamId: number, receivingTeamId: number, status: TradeDto['status'] = 'PENDING'): TradeDto => ({
    id, proposingTeamId, receivingTeamId, status, proposingTeamName: 'Proponente',
    receivingTeamName: 'Ricevente', offeredPlayerName: 'Offerto', requestedPlayerName: 'Richiesto',
    amount: 5, proposalDate: '2026-09-09T10:00:00Z',
  });

  async function setup() {
    TestBed.configureTestingModule({
      imports: [LeagueTrades], providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(LeagueTrades);
    fixture.componentRef.setInput('leagueId', 9);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/teams/me').flush([{ id: 1, leagueId: 9 }]);
    http.expectOne('/api/leagues/9/trades').flush([
      trade(11, 2, 1), trade(12, 1, 2), trade(13, 2, 3), trade(14, 2, 1, 'ACCEPTED'),
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, element: fixture.nativeElement as HTMLElement };
  }

  it('mostra tutti gli scambi, con azioni solo per le squadre coinvolte e gli stati consentiti', async () => {
    const { element, http } = await setup();
    const cards = element.querySelectorAll('article');
    expect(cards.length).toBe(4);
    expect(Array.from(cards[0].querySelectorAll('button'), button => button.textContent?.trim())).toEqual(['Accetta', 'Rifiuta']);
    expect(Array.from(cards[1].querySelectorAll('button'), button => button.textContent?.trim())).toEqual(['Annulla']);
    expect(cards[2].querySelectorAll('button').length).toBe(0);
    expect(cards[3].querySelectorAll('button').length).toBe(0);
    http.verify();
  });

  for (const status of ['ACCEPTED', 'REJECTED'] as const) {
    it(`invia ${status} e ricarica tutti gli scambi dopo il successo`, async () => {
      const { fixture, element, http } = await setup();
      const buttons = element.querySelector('article')!.querySelectorAll('button');
      buttons[status === 'ACCEPTED' ? 0 : 1].click();
      fixture.detectChanges();
      expect(buttons[0].disabled).toBe(true);
      const request = http.expectOne('/api/trades/11');
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ status });
      request.flush(null);
      await vi.waitFor(() => {
        TestBed.tick();
        http.expectOne('/api/leagues/9/trades').flush([trade(11, 2, 1, status)]);
      });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(element.querySelectorAll('article button').length).toBe(0);
      http.verify();
    });
  }
});
