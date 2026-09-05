import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-app-shell',
  styleUrl: './app-shell.css',
  templateUrl: './app-shell.html',
})
export class AppShell {
  private readonly document = inject(DOCUMENT);

  protected focusRouteHeading(): void {
    this.document.querySelector<HTMLElement>('[data-route-heading]')?.focus();
  }
}
