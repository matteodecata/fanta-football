import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TeamCreate } from './team-create';

describe('TeamCreate', () => {
  let fixture: ComponentFixture<TeamCreate>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamCreate],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ leagueId: '7' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(TeamCreate);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  function submitTeam(): void {
    const page = fixture.nativeElement as HTMLElement;
    const input = page.querySelector('input')!;
    input.value = 'Gli Imbattibili';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    page.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('torna alla dashboard solo dopo la conferma della creazione', async () => {
    submitTeam();
    const request = http.expectOne('/api/teams');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ teamName: 'Gli Imbattibili', leagueId: 7 });
    expect(navigate).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')!.disabled).toBe(true);
    request.flush({ id: 12, name: 'Gli Imbattibili' });
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('mostra un errore e permette di riprovare se la creazione fallisce', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    submitTeam();
    http.expectOne('/api/teams').flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(navigate).not.toHaveBeenCalled();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Non è stato possibile creare la squadra.');
    expect(page.querySelector('input')!.value).toBe('Gli Imbattibili');
    expect(page.querySelector('button')!.disabled).toBe(false);
  });
});
