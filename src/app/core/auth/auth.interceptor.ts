import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from './session';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(Session);
  const router = inject(Router);

  const token = session.token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).
              pipe(catchError((err: HttpErrorResponse) => {
                if(err.status === 401) {
                  session.logout();
                  router.navigateByUrl("/login");
                  return throwError(()=> err)
                }
                return throwError(()=> err)
              }))
};
