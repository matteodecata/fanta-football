import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DOCUMENT} from '@angular/common';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly document = inject(DOCUMENT);

  protected focusRouteHeading(): void {
    this.document.querySelector<HTMLElement>('[data-route-heading]')?.focus();
  }
}
