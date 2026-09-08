import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppShell } from './app-shell';
import { provideRouter, Router } from '@angular/router';
import { Session } from '../core/auth/session';

describe('AppShell', () => {
  let component: AppShell;
  let fixture: ComponentFixture<AppShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => TestBed.inject(Session).logout());

  it('mostra il nome utente e mantiene il collegamento alle impostazioni', () => {
    TestBed.inject(Session).login({ token: 'test', roles: [] }, 'Mario');
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector('.account-link');
    expect(link?.textContent).toContain('Mario');
    expect(link?.querySelector('svg')).not.toBeNull();
    (link as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(link?.getAttribute('aria-expanded')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('.account-actions a')?.getAttribute('href')).toBe('/account');
  });

  it('chiude il menu con Escape e ripristina il focus', () => {
    const page = fixture.nativeElement as HTMLElement;
    const trigger = page.querySelector<HTMLButtonElement>('.account-link')!;
    trigger.click();
    fixture.detectChanges();
    page.querySelector<HTMLAnchorElement>('.account-actions a')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('chiude il menu quando si clicca fuori', () => {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.account-link')!;
    trigger.click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('elimina la sessione e reindirizza al login con Logout', () => {
    const session = TestBed.inject(Session);
    session.login({ token: 'test', roles: [] }, 'Mario');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('.account-link')!.click();
    fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.account-actions button')!.click();
    expect(session.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('ff.session')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });
});
