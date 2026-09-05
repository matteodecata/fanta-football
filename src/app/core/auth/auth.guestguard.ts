import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

export const guestGuard: CanActivateFn = (_route) => {
  const session = inject(Session);
  return session.isAuthenticated()
    ? inject(Router).createUrlTree(['/dashboard'])
    : true;
};
