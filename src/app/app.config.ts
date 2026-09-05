import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';

// TODO (step Interceptor, Fase 2): una volta scritto `authInterceptor` in
// core/auth/auth.interceptor.ts, registralo qui:
// 1. Importa `withInterceptors` da '@angular/common/http' e `authInterceptor`
//    da './core/auth/auth.interceptor'.
// 2. Passa `withInterceptors([authInterceptor])` come argomento a
//    `provideHttpClient(...)` qui sotto.
//
// Domanda per capire il concetto: `withInterceptors` prende un ARRAY di
// interceptor. Se in futuro ne registrassimo due (es. uno per il token e uno
// per un logging generico), in che ordine verrebbero eseguiti sulla stessa
// richiesta — e perché potrebbe essere importante quell'ordine?

// Vengono eseguiti nell'ordine in cui sono registrati, l'ordine è impotante perchè
// se un interceptor modifica la richiesta o la risposta, gli interceptor successivi vedranno quelle modifiche.

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
