# FantaFootball Frontend — contesto di progetto e roadmap

> Documento di continuità per studenti e future sessioni di sviluppo.
> Riunisce lo stato reale di questo repository, le conoscenze acquisite con
> `intro-angular` e lo snapshot delle API del backend ricevuto il 2 settembre
> 2026. Se il backend cambia, verificare e aggiornare questa guida usando
> Swagger (`http://localhost:8081/swagger-ui.html`) e la documentazione backend.

## 1. Obiettivo

Questo repository conterrà il frontend Angular di **FantaFootball**, applicazione
di fantacalcio il cui backend è un'applicazione Java/Spring Boot separata.

Il frontend deve permettere agli utenti di autenticarsi, amministrare il proprio
account, creare o raggiungere leghe tramite invito, gestire squadre e rose,
consultare i calciatori e gestire gli scambi. Alcune funzionalità desiderabili
non sono ancora supportate dal backend e sono indicate esplicitamente come
bloccate.

## 2. Stato attuale del repository

Il progetto è stato generato con Angular CLI ed è ancora allo stato iniziale:

- Angular `22.1.x`, TypeScript `6.0.x`, RxJS `7.8.x`;
- npm 11 e test con Vitest;
- applicazione standalone, senza `AppModule`;
- `src/app/app.routes.ts` contiene ancora un array di route vuoto;
- `src/app/app.html` contiene il template dimostrativo di Angular CLI;
- `src/app/app.config.ts` configura il router ma non ancora `HttpClient`;
- non esistono ancora feature, modelli API, servizi, form o autenticazione;
- il backend non è contenuto in questo repository.

Comandi disponibili:

```sh
npm start
npm run build
npm test
```

Il frontend di sviluppo usa normalmente `http://localhost:4200`; il backend
FantaFootball usa `http://localhost:8081`.

## 3. Base didattica da rispettare

L'unico progetto Angular studiato finora è `intro-angular`, sviluppato con
Angular 22 e TypeScript strict. Le soluzioni di questo progetto devono rimanere
riconoscibili rispetto ai concetti già incontrati:

- componenti standalone e dipendenze ottenute con `inject()`;
- `signal()` per lo stato locale e `computed()` per quello derivato;
- `input()`, `input.required()`, `output()` e `model()` al posto dei decorator
  storici;
- control flow nativo `@if`, `@for` e `@switch`;
- aggiornamenti immutabili con `set()` e `update()`;
- servizi piccoli e focalizzati per stato condiviso e accesso HTTP;
- Signal Forms (`@angular/forms/signals`) per i nuovi form;
- route principali lazy-loaded tramite `loadComponent`;
- `HttpClient`, `httpResource`, Observable, `AsyncPipe` e `firstValueFrom()`;
- modelli TypeScript tipizzati per request e response;
- stati espliciti di caricamento, errore, vuoto e successo;
- test HTTP con `HttpTestingController` senza dipendere dalla rete reale.

Evitare `any`, `NgModule`, `ngClass`, `ngStyle`, `*ngIf`, `*ngFor`, constructor
injection, `@Input`, `@Output`, `@HostBinding` e `@HostListener`.

## 4. Requisiti di accessibilità

Ogni feature deve rispettare WCAG AA e superare i controlli AXE. In particolare:

- HTML semantico e controlli utilizzabili da tastiera;
- focus visibile e gestione del focus dopo la navigazione;
- skip link al contenuto principale;
- etichette e descrizioni associate ai campi dei form;
- errori di validazione collegati ai relativi controlli;
- `aria-live` per risultati asincroni e messaggi importanti;
- il colore non deve essere l'unico mezzo per comunicare uno stato;
- contrasto sufficiente e testo alternativo per le immagini informative;
- `NgOptimizedImage` per le immagini statiche.

## 5. Comunicazione frontend-backend

Il browser invia richieste HTTP al backend e riceve JSON:

```text
Angular (localhost:4200)
        |
        | HTTP + JSON + eventuale Bearer token
        v
Spring Boot FantaFootball (localhost:8081/api)
```

In sviluppo conviene configurare un proxy Angular che inoltri `/api` a
`http://localhost:8081`. I servizi possono così usare URL relativi come
`/api/players`, evitando URL locali hardcoded e problemi CORS. In alternativa,
il backend deve consentire via CORS l'origine `http://localhost:4200`.

Configurazioni frontend necessarie:

1. registrare `provideHttpClient()` in `app.config.ts`;
2. definire il proxy di sviluppo e collegarlo al target `serve`;
3. centralizzare il base path API, senza ripeterlo nei componenti;
4. aggiungere automaticamente il Bearer token alle richieste protette tramite
   interceptor funzionale;
5. trasformare gli errori HTTP nella forma comune usata dalla UI.

## 6. Autenticazione e sessione

Il backend usa JWT stateless e non usa cookie o sessioni server.

- `POST /api/auth/login` restituisce `{token, roles[]}`;
- tutte le API, salvo quelle pubbliche indicate sotto, richiedono
  `Authorization: Bearer <token>`;
- il backend identifica l'utente dal claim JWT `uid`;
- `POST /api/auth/logout` restituisce 204 ma non invalida il token lato server:
  il logout effettivo consiste nel cancellare il token nel frontend;
- modifica di username/password e disabilitazione account invalidano i token
  esistenti lato backend;
- un 401 indica token assente, invalido o scaduto e deve riportare al login;
- un 403 non implica necessariamente una sessione scaduta: può indicare anche
  un divieto relativo a ownership o amministrazione della lega.

Endpoint pubblici realmente implementati:

| Metodo | Endpoint | Request | Response |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `{username, password}` | `{token, roles[]}` |
| POST | `/api/auth/register` | `{username, email, password}` | `UserDto`, status 201 |
| POST | `/api/auth/forgot-password` | `{email}` | 204 |
| POST | `/api/auth/reset-password` | `{token, newPassword}` | 204 |

Non costruire feature su `/api/public/**` o `POST /api/registration-requests`:
sono consentiti dalla security configuration ma non hanno un controller.

### Decisione da prendere sulla persistenza del token

Prima di implementare l'autenticazione scegliere e documentare dove conservare
il JWT. Il backend non usa cookie HttpOnly, quindi le opzioni frontend più
semplici sono memoria, `sessionStorage` o `localStorage`, con compromessi tra
persistenza e impatto di un eventuale XSS. Non spargere accessi allo storage nei
componenti: incapsularli in un servizio di sessione.

## 7. Errori API

Gli errori di business hanno questa forma:

```ts
export interface ApiError {
  errorCode: string;
  message: string;
}
```

e status coerente, normalmente 400, 403, 404 o 409. Il casing di `errorCode`
non è uniforme: alcuni codici sono `snake_case`, altri `SCREAMING_SNAKE_CASE`.
Non normalizzare il valore e non affidarsi a un solo casing; confrontare la
stringa esatta quando serve un comportamento specifico. Per un messaggio
generico mostrare il `message` restituito dal backend.

## 8. Dominio essenziale

- Un utente può possedere al massimo una squadra per lega.
- La lega ha un admin contestuale e un budget iniziale per le squadre.
- Il ruolo globale `ADMIN`/`USER` non determina i permessi nella lega.
- Una squadra appartiene a un utente e a una lega; il budget cambia con acquisti
  e scambi.
- Un giocatore con `transferDate` valorizzata non è più attivo in quella rosa.
- Un utente non admin entra in lega soltanto tramite invito nominale accettato e
  deve poi creare la squadra con una seconda richiesta.
- Gli scambi coinvolgono due squadre della stessa lega, un giocatore per parte
  ed eventualmente un conguaglio.
- Le giornate e i risultati reali arrivano automaticamente da LeagueSim; il
  frontend non deve avviare la simulazione.
- L'admin di lega gestisce gli acquisti dell'asta per tutte le squadre; non sono
  acquisti self-service dei proprietari.

## 9. Modelli TypeScript da creare

Tenere i tipi organizzati per dominio. I tipi sotto riflettono lo snapshot API;
verificarli sulla spec OpenAPI quando vengono implementati.

```ts
export type PlayerRole = 'P' | 'D' | 'C' | 'A';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { token: string; roles: string[]; }
export interface CreateUserRequest { username: string; email: string; password: string; }
export interface UserDto { id: number; username: string; enabled: boolean; roles: string[]; }

export interface TeamResponse {
  id: number;
  name: string;
  userId: number;
  leagueId: number;
  leagueName: string;
  budget: number;
  totalPoints: number;
}

export interface TeamStandingResponse {
  teamId: number;
  teamName: string;
  username: string;
  budget: number;
  totalPoints: number;
}

export interface PlayerResponse {
  id: number;
  externalId: number;
  name: string;
  surname: string;
  role: PlayerRole;
  realTeamName: string;
  realTeamShirtNum: number;
  price: number;
  injured: boolean;
}

export interface TeamPlayerResponse {
  id: number;
  teamId: number;
  playerId: number;
  name: string;
  surname: string;
  realTeamName: string;
  realTeamShirtNum: number;
  injured: boolean;
  purchaseDate: string;
  transferDate: string | null;
  purchasePrice: number;
}

export interface InviteResponse {
  id: number;
  leagueId: number;
  invitedByUserId: number;
  invitedUserId: number;
  status: InviteStatus;
  sentDate: string;
  responseDate: string | null;
}

export interface TradeDto {
  id: number;
  proposingTeamId: number;
  proposingTeamName: string;
  receivingTeamId: number;
  receivingTeamName: string;
  requestedPlayerName: string;
  offeredPlayerName: string;
  amount: number;
  status: TradeStatus;
  proposalDate: string;
}

export interface LeagueMatchDto {
  id: number;
  roundNumber: number;
  matchDay: unknown; // verificare la forma esatta nella spec OpenAPI
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
}
```

I campi numerici e temporali devono essere confermati su `/v3/api-docs` prima
di consolidare i modelli: la documentazione ricevuta non specifica sempre il
tipo Java preciso o il formato di tutte le date.

## 10. Contratto API per feature

### Account autenticato

| Metodo | Endpoint | Request | Response / effetto |
| --- | --- | --- | --- |
| GET | `/api/account/me/leagues` | — | lista `{league, team, admin}` |
| PATCH | `/api/account/me/username` | `{newUsername, currentPassword}` | 204, invalida JWT |
| PUT | `/api/account/me/password` | `{currentPassword, newPassword}` | 204, invalida JWT |
| DELETE | `/api/account/me` | `{currentPassword}` | 204, account disabilitato |

### Leghe e squadre

| Metodo | Endpoint | Request | Response / permesso |
| --- | --- | --- | --- |
| POST | `/api/leagues` | `{name, teamName, budget}` | crea lega e prima squadra, 201 |
| GET | `/api/leagues/{leagueId}/teams` | — | classifica; solo membri della lega |
| POST | `/api/teams` | `{teamName, leagueId}` | crea squadra dopo invito accettato, 201 |
| GET | `/api/teams/me` | — | squadre dell'utente corrente |
| PATCH | `/api/teams/{teamId}` | `{name}` | rinomina; solo proprietario |
| GET | `/api/teams/{teamId}/players` | — | rosa; proprietario o admin lega |
| DELETE | `/api/teams/{teamId}/players/{playerId}` | — | svincola, 204; proprietario o admin |

Lo svincolo fallisce con `PLAYER_IN_USE` se il giocatore compare in almeno una
formazione.

### Inviti

| Metodo | Endpoint | Request | Response / permesso |
| --- | --- | --- | --- |
| POST | `/api/leagues/{leagueId}/invites` | `{invitedUsername}` | invito, 201; solo admin lega |
| GET | `/api/invites/pending` | — | inviti pending dell'utente |
| PATCH | `/api/invites/{inviteId}` | `{status: 'ACCEPTED' | 'DECLINED'}` | invito aggiornato |

Accettare un invito **non crea la squadra**. La UI deve accompagnare l'utente
alla creazione della squadra con `POST /api/teams`.

### Calciatori e asta

| Metodo | Endpoint | Request | Response / permesso |
| --- | --- | --- | --- |
| GET | `/api/players` | filtri query opzionali | catalogo calciatori |
| GET | `/api/players/{playerId}/matchdays/{matchdayId}/rating` | — | `{fantaRating}` |
| POST | `/api/leagues/{leagueId}/teams/{teamId}/players/{playerId}` | `{purchasePrice}` | 204; solo admin lega |

Filtri disponibili per il catalogo: `role`, `realTeamName`, `minPrice`,
`maxPrice`, `injured`. Un rating assente produce 404
`player_result_not_found`, situazione normale se il calciatore non ha giocato.

### Scambi

| Metodo | Endpoint | Request | Response / effetto |
| --- | --- | --- | --- |
| POST | `/api/trades` | `{receivingTeamId, requestedPlayerId, offeredPlayerId, amount?}` | `TradeDto`, 201 |
| GET | `/api/trades` | — | scambi dell'utente |
| GET | `/api/teams/{teamId}/trades?scope=history` | — | storico squadra |
| GET | `/api/teams/{teamId}/trades?status=pending&direction=received` | — | pending ricevuti |
| GET | `/api/teams/{teamId}/trades?status=pending&direction=sent` | — | pending inviati |
| PATCH | `/api/trades/{tradeId}` | `{status: 'ACCEPTED' | 'REJECTED'}` | 204 |

Un `amount` positivo è pagato dal proponente; uno negativo dal ricevente.
Soltanto il ricevente può accettare, mentre entrambi possono rifiutare. Filtri
diversi dalle combinazioni documentate producono `invalid_trade_filters`.

### Calendario e punteggi

| Metodo | Endpoint | Request | Response / permesso |
| --- | --- | --- | --- |
| POST | `/api/leagues/{leagueId}/matches` | — | calendario, 201; solo admin lega |
| GET | `/api/lineups/{lineupId}/score` | — | `{score, goals}` |

Il calendario può essere generato una sola volta. Il frontend usa anche
`GET /api/leagues/{leagueId}/matches` per recuperare un calendario già generato;
il backend deve restituire 404 (o `calendar_not_found`) se non è ancora presente.
Il punteggio è disponibile solo per lineup già esistenti e dopo la chiusura della
giornata.

## 11. Architettura frontend proposta

Organizzare il codice per feature, mantenendo servizi e componenti piccoli:

```text
src/app/
|-- core/
|   |-- auth/          sessione, API auth, interceptor, guard
|   |-- http/          gestione ApiError
|   `-- layout/        shell, navigazione e focus route
|-- shared/            componenti riutilizzabili e presentazionali
|-- features/
|   |-- auth/          login, registrazione, recupero password
|   |-- dashboard/     leghe, squadre e inviti dell'utente
|   |-- account/       username, password, disabilitazione
|   |-- leagues/       creazione, dettaglio, classifica, inviti, calendario
|   |-- teams/         squadra, rosa, rinomina
|   |-- players/       catalogo e filtri
|   `-- trades/        creazione, ricevuti, inviati e storico
|-- app.config.ts
|-- app.routes.ts
`-- app.ts
```

Ogni pagina principale va caricata con `loadComponent`. I componenti non devono
costruire URL né contenere regole di trasporto HTTP: delegano a un servizio API
tipizzato della feature. Lo stato strettamente locale resta nel componente;
sessione e selezioni condivise possono vivere in servizi a signal readonly.

## 12. Route frontend proposte

Le route sono una proposta iniziale e possono essere affinate prima
dell'implementazione:

| Route | Accesso | Scopo |
| --- | --- | --- |
| `/login` | pubblico | autenticazione |
| `/register` | pubblico | registrazione |
| `/forgot-password` | pubblico | richiesta reset |
| `/reset-password` | pubblico | nuova password dal token |
| `/dashboard` | autenticato | leghe, squadre e inviti dell'utente |
| `/account` | autenticato | impostazioni account |
| `/players` | autenticato | catalogo calciatori e filtri |
| `/leagues/new` | autenticato | creazione lega e squadra admin |
| `/leagues/:leagueId` | membro | dettaglio e classifica |
| `/leagues/:leagueId/team/new` | invitato | creazione squadra dopo invito |
| `/teams/:teamId` | autorizzato | rosa e gestione squadra |
| `/teams/:teamId/trades` | proprietario | scambi della squadra |
| `/**` | tutti | pagina non trovata |

Le guard migliorano il flusso di navigazione, ma non sostituiscono mai i
controlli di autorizzazione del backend.

## 13. TO-DO frontend

La checklist è ordinata per dipendenze: completare una fase prima di costruire
feature che dipendono da essa.

### Fase 0 — verifica del contratto

- [ ] Avviare backend e consultare `/v3/api-docs`.
- [ ] Confermare tipi degli ID, date, `LeagueResponse`, `UserLeagueTeamResponse`
  e campo `matchDay` di `LeagueMatchDto`.
- [ ] Salvare esempi reali delle response principali senza dati sensibili.
- [ ] Concordare dove persistere il JWT.
- [ ] Concordare la strategia proxy/CORS per sviluppo e produzione.

### Fase 1 — fondamenta Angular

- [ ] Rimuovere il template dimostrativo Angular CLI.
- [ ] Creare shell accessibile, skip link, navigazione e `RouterOutlet`.
- [ ] Configurare route lazy e pagina 404.
- [ ] Registrare `provideHttpClient()`.
- [ ] Configurare il proxy `/api` verso `http://localhost:8081`.
- [ ] Creare `ApiError` e gestione coerente degli errori HTTP.
- [ ] Creare modelli request/response strict per dominio.
- [ ] Aggiungere test di base per shell, route e servizi HTTP.

### Fase 2 — autenticazione

- [ ] Creare `AuthApiService` e servizio di sessione a signal.
- [ ] Implementare form di login.
- [ ] Implementare interceptor Bearer funzionale.
- [ ] Implementare guard per route autenticate e redirect al login.
- [ ] Gestire 401 cancellando la sessione e tornando al login.
- [ ] Non trattare automaticamente tutti i 403 come logout.
- [ ] Implementare logout locale con chiamata opzionale all'endpoint 204.
- [ ] Implementare registrazione con validazione e conflitti username/email.
- [ ] Implementare richiesta e completamento reset password.
- [ ] Testare login, token allegato, logout e risposta 401.

### Fase 3 — dashboard e account

- [ ] Mostrare leghe/team dell'utente da `/api/account/me/leagues`.
- [ ] Mostrare e gestire gli inviti pending.
- [ ] Dopo un invito accettato, guidare alla creazione della squadra.
- [ ] Implementare modifica username e successivo nuovo login.
- [ ] Implementare modifica password e successivo nuovo login.
- [ ] Implementare disabilitazione account con conferma accessibile.
- [ ] Testare stati loading, empty, error e success.

### Fase 4 — leghe e squadre

- [ ] Creare lega insieme alla prima squadra e al budget iniziale.
- [ ] Mostrare classifica con nome squadra, username, budget e punti.
- [ ] Mostrare dettaglio squadra e rosa.
- [ ] Implementare rinomina squadra per il proprietario.
- [ ] Implementare svincolo del giocatore con conferma.
- [ ] Gestire `PLAYER_IN_USE` con un messaggio specifico.
- [ ] Mostrare le azioni admin soltanto quando il flag `admin` lo consente.
- [ ] Implementare invito nominale da parte dell'admin della lega.

### Fase 5 — calciatori e asta

- [ ] Mostrare il catalogo completo dei calciatori.
- [ ] Implementare filtri per ruolo, squadra reale, prezzo e infortunio.
- [ ] Sincronizzare i filtri con signal e query HTTP senza logica complessa nel
  template.
- [ ] Mostrare chiaramente ruolo, prezzo e stato infortunio anche senza affidarsi
  soltanto al colore.
- [ ] Creare il flusso asta riservato all'admin della lega.
- [ ] Consentire all'admin di scegliere squadra, calciatore e prezzo d'acquisto.
- [ ] Gestire `player_already_owned` e `budget_too_low`.
- [ ] Implementare consultazione del fantavoto per calciatore e giornata quando
  sia disponibile un `matchdayId` utilizzabile nella UI.

### Fase 6 — scambi

- [ ] Mostrare scambi complessivi dell'utente.
- [ ] Mostrare storico, pending ricevuti e pending inviati per squadra.
- [ ] Creare proposta con squadra ricevente, giocatori e conguaglio opzionale.
- [ ] Spiegare nella UI il significato del segno del conguaglio.
- [ ] Consentire accettazione soltanto al ricevente.
- [ ] Consentire rifiuto ai partecipanti ammessi.
- [ ] Aggiornare liste, budget e rose dopo un'azione completata.
- [ ] Gestire trade cancellati automaticamente dopo l'accettazione di uno
  scambio concorrente.

### Fase 7 — calendario e punteggi disponibili

- [ ] Consentire all'admin di generare il calendario una sola volta.
- [ ] Mostrare immediatamente la response del calendario generato.
- [ ] Gestire `calendar_already_generated` e assenza di giornate aperte.
- [ ] Implementare lettura del punteggio solo se la UI dispone di un lineup ID.
- [ ] Gestire `matchday_not_closed` come stato atteso, non come errore generico.

### Fase 8 — qualità e consegna

- [ ] Aggiungere test unitari per servizi, form, guard e interceptor.
- [ ] Intercettare le richieste nei test con `HttpTestingController`.
- [ ] Verificare navigazione da tastiera, focus e annunci screen reader.
- [ ] Eseguire AXE sulle pagine e correggere tutte le violazioni.
- [ ] Testare layout responsive e contrasto WCAG AA.
- [ ] Eseguire `npm test` e `npm run build`.
- [ ] Documentare avvio con frontend, backend e proxy.

## 14. TO-DO backend bloccanti o da concordare

Questi elementi non sono implementabili soltanto nel frontend:

- [ ] **Creazione/modifica lineup:** manca qualunque endpoint per schierare
  titolari e panchina. È il blocco principale per la feature formazione.
- [ ] **Lettura calendario:** manca un GET per recuperare un calendario già
  generato; il POST lo restituisce soltanto al momento della creazione.
- [ ] **Join con invite code:** `League.inviteCode` esiste, ma nessun endpoint lo
  usa. Oggi l'ingresso avviene soltanto tramite invito nominale.
- [ ] **Scoperta giornate:** verificare se esiste o aggiungere un endpoint che
  permetta al frontend di ottenere i `matchdayId` necessari per i fantavoti.
- [ ] **Lettura lineup:** verificare come il frontend possa ottenere i lineup ID
  richiesti dall'endpoint score.
- [ ] Uniformare, se possibile, il casing di `errorCode` nel backend.
- [ ] Aggiungere descrizioni OpenAPI per regole, errori e autorizzazioni.

Finché questi punti non vengono risolti, non progettare interfacce che fingano
di poter salvare formazioni, rileggere calendari o entrare tramite codice.

## 15. Regole operative per sessioni future

Prima di modificare il progetto:

1. leggere `AGENTS.md` e questo file;
2. controllare lo stato reale dei file e non assumere che i TO-DO siano ancora
   aperti;
3. verificare il contratto API quando si introduce o modifica una chiamata;
4. mantenere componenti piccoli e servizi focalizzati;
5. non inserire regole di autorizzazione soltanto nel frontend;
6. non introdurre una libreria di stato o UI senza una necessità concreta;
7. aggiornare questa checklist marcando soltanto lavori realmente verificati;
8. eseguire test e build dopo ogni fase significativa.

## 16. Fonti usate per questo documento

- `PROJECT-GUIDE.md` di `intro-angular`: concetti studiati, Angular 22,
  convenzioni, accessibilità e test.
- `FRONTEND_API_CONTEXT.md` del backend: snapshot di endpoint, DTO, permessi,
  errori e funzionalità mancanti.
- stato del repository `fanta-football` verificato il 2 settembre 2026.

Questo documento è una guida di lavoro, non sostituisce il contratto OpenAPI né
il codice del backend.
