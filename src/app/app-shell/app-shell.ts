import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Session } from '../core/auth/session';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-app-shell',
  styleUrl: './app-shell.css',
  templateUrl: './app-shell.html',
  host: {
    '(document:click)': 'closeOutside($event)',
    '(document:keydown.escape)': 'closeAccountMenu(true)',
    '(document:focusin)': 'closeOutside($event)',
  },
})
export class AppShell {
  protected readonly session = inject(Session);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly accountMenu = viewChild<ElementRef<HTMLElement>>('accountMenu');
  private readonly accountTrigger = viewChild<ElementRef<HTMLButtonElement>>('accountTrigger');
  protected readonly accountMenuOpen = signal(false);

  protected closeAccountMenu(restoreFocus = false): void {
    if (!this.accountMenuOpen()) return;
    this.accountMenuOpen.set(false);
    if (restoreFocus) this.accountTrigger()?.nativeElement.focus();
  }

  protected closeOutside(event: Event): void {
    if (event.target && !this.accountMenu()?.nativeElement.contains(event.target as Node)) {
      this.closeAccountMenu();
    }
  }

  protected logout(): void {
    this.closeAccountMenu();
    this.session.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  protected focusRouteHeading(): void {
    this.closeAccountMenu();
    this.document.querySelector<HTMLElement>('[data-route-heading]')?.focus();
  }
}
