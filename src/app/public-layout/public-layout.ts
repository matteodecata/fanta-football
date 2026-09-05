import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-public-layout',
  styleUrl: './public-layout.css',
  templateUrl: './public-layout.html',
})
export class PublicLayout {
  private readonly document = inject(DOCUMENT);

  protected focusRouteHeading(): void {
    this.document.querySelector<HTMLElement>('[data-route-heading]')?.focus();
  }
}
