import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

// TODO (step HttpClient):
// 1. Importa `provideHttpClient` da '@angular/common/http'.
// 2. Aggiungilo all'array `providers` qui sotto.
//
// Domanda per capire il concetto: in Angular standalone non esiste più un NgModule
// che "dichiara" HttpClient per tutta l'app. Perché pensi che serva comunque una
// funzione `provide...` invece di poter fare semplicemente `inject(HttpClient)`
// da un servizio senza aggiungere nulla qui?

// viene istanziato Singleton per tutta l'app cosi da essere accessibile da tutti,
// provideHttpClient è una funzione che registra tutto quello che ci serve per poter fare le chiamate

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient()
  ]
};
