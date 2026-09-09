# FantaFootball Frontend — contesto di progetto e roadmap

> Documento di continuità per studenti e future sessioni di sviluppo.
> Riunisce lo stato reale di questo repository, le conoscenze acquisite con
> `intro-angular` e lo snapshot delle API del backend ricevuto il 2 settembre
> 2026. Se il backend cambia, verificare e aggiornare questa guida usando
> Swagger (`http://localhost:8081/swagger-ui.html`) e la documentazione backend.
>
> Aggiornato il 7 settembre 2026 dopo il merge dei branch `feature/daniele` e
> `myriam-spagnuolo`: gran parte delle feature di base è stata implementata
> dal team. La sezione 13 riflette ora il briefing di allineamento del team
> (rifinitura UI e feature da confermare), non più il TO-DO da zero.
>
> Aggiornato l'8 settembre 2026 dopo una verifica puntuale dello stato reale
> del codice (sessione Jacopo): parecchi punti della sezione 13 risultano
> completati rispetto al 7 settembre (login, register, dashboard, calendario,
> classifica, inviti, verifica admin) e sono stati marcati di conseguenza;
> `team-trades` resta l'area più indietro. È emerso anche un bug non ancora
> documentato sulla cache delle leghe in dashboard (vedi 13.1bis).
>
> **Da leggere prima di lavorare sulle formazioni**: l'8 settembre 2026 è
> stato confermato su Swagger il contratto per le Lineup (sezioni 8, 9, 10),
> ma era emerso un buco nel DTO di `GET /api/leagues/{leagueId}/matches`
> (mancava lo stato "chiusa" della matchday, il punteggio e il lineupId per
> squadra). Il 9 settembre 2026 il backend ha aggiunto `matchdayClosed`,
> `homeScore`/`awayScore` e `homeGoals`/`awayGoals`: il Calendario ora
> mostra il risultato reale. Resta solo il buco sul `homeLineupId`/
> `awayLineupId` per squadra — dettaglio in sezione 14, blocco "Formazioni
> (Lineup)".

## 1. Obiettivo

Questo repository conterrà il frontend Angular di **FantaFootball**, applicazione
di fantacalcio il cui backend è un'applicazione Java/Spring Boot separata.

Il frontend deve permettere agli utenti di autenticarsi, amministrare il proprio
account, creare o raggiungere leghe tramite invito, gestire squadre e rose,
consultare i calciatori e gestire gli scambi. Alcune funzionalità desiderabili
non sono ancora supportate dal backend e sono indicate esplicitamente come
bloccate.

## 2. Stato attuale del repository

Il progetto è stato generato con Angular CLI. Dopo i merge di più branch del
team, le fondamenta e la maggior parte delle feature principali esistono già
in una prima versione funzionante; il lavoro rimanente è soprattutto di
rifinitura UI/UX e di alcune feature ancora da confermare col backend.

- Angular `22.1.x`, TypeScript `6.0.x`, RxJS `7.8.x`;
- npm 11 e test con Vitest;
- applicazione standalone, senza `AppModule`;
- `src/app/app.routes.ts` definisce già tutte le route principali (pubbliche
  sotto `public-layout`, protette sotto `app-shell` con `authGuard`);
- `provideHttpClient()`, interceptor Bearer (`core/auth/auth.interceptor.ts`)
  e servizio di sessione (`core/auth/session.ts`) sono implementati;
- feature presenti in `src/app/`: `landing-page`, `login`, `register`,
  `forgot-password`, `reset-password`, `dashboard` (con `user-leagues` e
  `pending-invites`), `account` (con `change-username`, `change-password`,
  `disable-account`), `players`, `league-create` (con `create-admin-team`),
  `league-detail` (con `invite-league` e `standings`), `team-create`,
  `team-detail` (con `team-roster`, `rename-team`, `player-release`),
  `team-trades`, `Calendar`;
- il backend non è contenuto in questo repository.

**Non assumere che queste feature siano complete o rifinite**: sono
implementazioni di prima passata dai vari branch; verificare sempre lo stato
reale del file prima di modificarlo (vedi sezione 15).

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

### Decisione presa sulla persistenza del token

Il JWT viene conservato in `sessionStorage`. Il backend non usa cookie
HttpOnly, quindi non esiste un'opzione priva di rischio XSS residuo; rispetto
a `localStorage` si è preferito `sessionStorage` per limitare la superficie
temporale di esposizione del token (sparisce alla chiusura della tab, non è
condiviso tra tab diverse), accettando come contropartita un login più
frequente per l'utente. L'accesso allo storage non va sparso nei componenti:
va incapsulato in un servizio di sessione (`core/auth/`).

### Id utente lato frontend (aggiunto l'8 settembre 2026)

`Session` (`core/auth/session.ts`) espone ora anche `userId`, un `computed()`
che decodifica il payload del JWT (`core/auth/jwt.ts`, funzione pura
`decodeJwtPayload`) per leggere il claim `uid`. Un JWT standard non è
cifrato, solo firmato: il payload è già leggibile da chiunque abbia il
token, quindi decodificarlo lato client non espone nulla di nuovo. Serve
solo a decisioni di UI (es. `league-detail.ts` confronta
`league.adminUserId === session.userId()` per mostrare le azioni admin);
**non sostituisce mai** il controllo di autorizzazione reale, che resta
sempre lato backend. Nessun altro componente deve decodificare il token
direttamente: si passa sempre da `session.userId()`.

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
- Una **Lineup** è la formazione che una squadra schiera per una propria
  `LeagueMatch`: vincolo univoco `(teamId, leagueMatchId)`, una sola
  formazione per squadra per partita (confermato su Swagger l'8 settembre
  2026, vedi sezioni 9-10 e 14).
- Il modulo (`LineupType`) fissa il numero di difensori/centrocampisti/
  attaccanti; il portiere è sempre 1, implicito, non va scelto.
- I `LineupPlayer` sono titolari o panchina (`starter: boolean`); i subentri
  per ruolo, se un titolare non ha giocato, sono calcolati dal backend — il
  frontend non deve replicare questa logica, solo raccogliere la selezione.
- La Lineup è modificabile solo finché la `Matchday` reale collegata non è
  `closed`; dopo la chiusura il fantavoto diventa calcolabile e la
  formazione si blocca. **Questo stato non è ancora esposto da nessuna
  risposta API disponibile al frontend** — vedi il blocco backend in
  sezione 14 prima di costruire la UI di editing.

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
  matchDay: unknown; // verificato l'8 settembre 2026: è una stringa ISO
  // (timestamp), non un riferimento alla Matchday. Non basta a sapere se la
  // giornata è "closed", né a leggere punteggi/lineupId. Vedi sezione 14,
  // blocco "Formazioni (Lineup)": il DTO reale va integrato lato backend.
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
}

// Confermate su Swagger l'8 settembre 2026 (request/response reali, non
// proposte). Vedi sezione 10 "Formazioni (Lineup)" per gli endpoint.
export interface LineupTypeResponse {
  id: number;
  numDefenders: number;
  numMidfielders: number;
  numForwards: number;
}

export interface LineupPlayerRequest {
  teamPlayerId: number;
  starter: boolean;
}

export interface LineupPlayerResponse {
  teamPlayerId: number;
  playerId: number;
  name: string;
  surname: string;
  role: PlayerRole;
  starter: boolean;
}

export interface LineupRequest {
  lineupTypeId: number;
  defensive: boolean; // semantica gestita interamente lato backend
  players: LineupPlayerRequest[];
}

export interface LineupResponse {
  id: number;
  teamId: number;
  leagueMatchId: number;
  lineupTypeId: number;
  defensive: boolean;
  players: LineupPlayerResponse[];
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
| GET | `/api/leagues/{leagueId}` | — | dettaglio lega (`id, name, budget, adminUserId, createdAt?`); confermato l'8 settembre 2026, non era ancora documentato |
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

**Attenzione**: la risposta reale di `GET /api/leagues/{leagueId}/matches`,
verificata l'8 settembre 2026, non contiene punteggi né alcun riferimento a
lineup o allo stato "chiusa" della matchday — vedi il dettaglio nel blocco
"Formazioni (Lineup)" in sezione 14 prima di costruire UI che ne dipendono.

### Formazioni (Lineup)

Confermato su Swagger l'8 settembre 2026 (request/response reali, tipi in
sezione 9).

| Metodo | Endpoint | Request | Response / permesso |
| --- | --- | --- | --- |
| GET | `/api/lineup-type` | — | `LineupTypeResponse[]`, catalogo moduli |
| GET | `/api/teams/{teamId}/matches/{leagueMatchId}/lineup` | — | `LineupResponse` della squadra per quella partita |
| POST | `/api/teams/{teamId}/matches/{leagueMatchId}/lineup` | `LineupRequest` | crea la formazione, `LineupResponse` |
| PUT | `/api/teams/{teamId}/matches/{leagueMatchId}/lineup` | `LineupRequest` | aggiorna la formazione, `LineupResponse` |

Vincolo di dominio (sezione 8): una sola Lineup per coppia `(teamId,
leagueMatchId)`, modificabile solo finché la Matchday collegata non è
`closed`. Nessuno dei payload sopra espone questo stato, e non è ancora
stato verificato se POST/PUT restituiscono un errore esplicito quando si
tenta di modificare una formazione a giornata chiusa — vedi sezione 14.

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

### Pagina squadre — aggiornamento del 7 settembre 2026

- Aggiunta `/teams` alla navbar: selezione delle leghe dell'utente, selezione
  automatica se unica, ricerca per nome squadra o fantallenatore e link alla rosa.
- La lega selezionata resta nel query parameter `leagueId`, anche nel dettaglio
  `/teams/:teamId`, con collegamento per tornare all'elenco della stessa lega.
- Il dettaglio usa `GET /api/account/me/leagues` e
  `GET /api/leagues/{leagueId}/teams` per nome squadra, fantallenatore, punti e
  crediti. Swagger locale è stato verificato: `GET /api/teams/{teamId}` non esiste.
  I link precedenti senza lega possono risolvere le squadre dell'utente tramite
  la risposta account; per le altre squadre usare l'elenco con `leagueId`.
- La rosa usa `GET /api/teams/{teamId}/players`, esclude i giocatori con
  `transferDate` valorizzata e recupera il ruolo dal catalogo `/api/players`
  abbinando `playerId`. Mostra il prezzo effettivo di acquisto, non la quotazione.
- La fantamedia non è esposta dal contratto OpenAPI corrente: viene indicata
  come non disponibile. Occorre un dato aggregato lato backend per completarla.
- La lettura delle rose avversarie rimane soggetta ai permessi backend:
  un 403 mostra un messaggio esplicito. Per consentirla a tutti i membri serve
  un aggiornamento backend; nessuna autorizzazione viene aggirata dal frontend.
- Rinomina visibile solo per la propria squadra; svincolo per proprietario o
  admin contestuale. Per lo svincolo viene passato `playerId`, non l'ID della
  relazione squadra-giocatore.
- Aggiunti test HTTP/componenti per selezione lega, ricerca, collegamenti,
  dettaglio avversario, ruoli, giocatori trasferiti e accesso negato.
- Verifica AXE e prova end-to-end con utenti reali ancora da eseguire.

Aggiornato dopo il briefing di team del 7 settembre 2026. Le fondamenta
(Fasi 0-2 sotto) sono sostanzialmente completate: l'obiettivo ora è
rifinire le feature già presenti fino ad avere una web app solida sulle
funzionalità più importanti, tenendo marginali le funzionalità accessorie.

### 13.1 Rifinitura prioritaria (confermata dal team)

Feature esistenti da sistemare, in ordine di priorità concordato:

- [x] **Landing page**: non più il placeholder Angular CLI, ha già hero,
  copy e CTA verso `/login` (`landing-page.html`). Resta aperto solo il
  dettaglio "nav bar": la landing in sé ha solo il CTA, la vera `<nav>` è
  nel `public-layout` che la wrappa — verificare se copre il requisito o se
  ne serve una dedicata.
- [x] **Login**: aggiungere la possibilità di mostrare/nascondere la password
  (toggle visibilità sul campo password). Fatto, vedi
  `login.ts` (`togglePasswordVisibility`).
- [x] **Register**: aggiungere placeholder ai campi e messaggi di errore
  chiari per i campi compilati in modo errato. Fatto, vedi `register.html`
  (placeholder, errori di validazione, requisiti password in tempo reale,
  toggle password).
- [x] **Dashboard**: nella card lega, tenere solo l'azione "Dettagli lega" ed
  evidenziare meglio (testo più grande) punti e crediti. Fatto, vedi
  `user-leagues.html`.
- [ ] **New League page**: sistemare la grafica e, al termine della
  creazione, tornare alla dashboard aggiornata con la nuova lega. La
  navigazione post-creazione (`router.navigateByUrl('/dashboard')` in
  `league-create.ts`) c'è, ma la dashboard può mostrare dati non aggiornati:
  vedi il bug "cache leghe non invalidata" in 13.1bis.
- [ ] **Players**: migliorare il layout dei filtri (leggibilità e
  disposizione, non la logica di filtro già presente). Nota: oggi i filtri
  sono tutti client-side dopo aver scaricato l'intero catalogo; i filtri
  lato backend documentati in sezione 10 (`role`, `realTeamName`,
  `minPrice`, `maxPrice`, `injured`) non vengono mai usati nella chiamata
  HTTP. Non bloccante ora, da tenere d'occhio se il catalogo cresce.
- [ ] **Trades**: garantire tre viste distinte —
  - scambi dell'utente corrente,
  - scambi dell'intera lega,
  - scambi di ogni singola squadra/team.

### 13.1bis Bug noti da correggere

Emersi da una verifica del codice il 7 settembre 2026; più urgenti della pura
rifinitura grafica elencata sopra perché rompono funzionalità esistenti.
Aggiornato l'8 settembre 2026 dopo una nuova verifica puntuale.

- [ ] **`team-trades.ts` usa un `teamId` hardcoded**: `currentTeamId = 1` con
  commento `// Replace with the logged-in team's ID`. La pagina scambi mostra
  sempre i dati della squadra 1, mai quelli dell'utente loggato. Ancora
  presente, invariato.
- [ ] **`submitProposal()` in `team-trades.ts` non chiama nessuna API**: legge
  il valore del form e basta; il bottone di creazione scambio sembra
  funzionare ma non fa nulla. Ancora presente, invariato.
- [ ] **`team-trades.ts` chiama `HttpClient` direttamente nel componente**
  invece di usare un service dedicato: viola l'organizzazione per feature
  della sezione 11 (i componenti non devono contenere regole di trasporto
  HTTP). Ancora presente, invariato.
- [x] **`Calendar` (`src/app/Calendar`) è orfano** — RISOLTO l'8 settembre
  2026: ora è agganciato dentro `league-detail.html`
  (`<app-calendar [leagueId]="leagueId" [isAdmin]="isAdmin()" />`), con
  generazione, gestione di `calendar_already_generated`/`no_open_matchday`/
  `matchday_not_closed` e lettura punteggio.
- [x] **Mismatch di endpoint classifica/standings** — RISOLTO l'8 settembre
  2026: `standings.ts` ora chiama `GET /api/leagues/{leagueId}/teams`
  (confermato reale sul backend, restituisce l'array ordinato per punti
  decrescenti), non più `/standings`. Il bottone "Membri" separato nel
  dettaglio lega è stato rimosso perché ridondante con "Classifica", che usa
  la stessa risorsa.
- [ ] **Nav bar con TODO irrisolti** — parzialmente risolto l'8 settembre
  2026: in `app-shell.html` "Squadre" punta ora correttamente a `/teams`.
  "Scambi" punta **ancora** a `/dashboard` con lo stesso commento TODO; resta
  legato allo sblocco di `team-trades.ts` sopra.
- [x] **`landing-page.html` non è più il placeholder di Angular CLI** —
  vedi punto Landing page in 13.1 per il dettaglio.

### 13.1bis-2 Bug nuovo trovato l'8 settembre 2026

- [ ] **Cache leghe non invalidata dopo la creazione**:
  `UserLeaguesService.userLeagues` (`dashboard/user-leagues/user-leagues.service.ts`)
  è un `httpResource` singleton (`providedIn: root`) caricato una sola volta.
  `LeagueCreate.onSubmit` (`league-create.ts`), dopo aver creato la lega, fa
  solo `router.navigateByUrl('/dashboard')` senza chiamare `.reload()` sulla
  risorsa. Risultato: tornando alla dashboard la nuova lega potrebbe non
  comparire finché l'utente non ricarica manualmente la pagina — non
  soddisfa il requisito "tornare alla dashboard aggiornata con la nuova
  lega" del punto "New League page" in 13.1.

### 13.1ter Accessibilità

Requisiti già previsti in sezione 4 ma non ancora rispettati nel codice
attuale.

- [ ] `index.html` ha `<html lang="en">` mentre tutta la UI è in italiano:
  cambiare in `lang="it"`.
- [ ] Manca uno skip link al contenuto principale, sia in `app-shell` che in
  `public-layout`.

### 13.1quater Test mancanti

- [ ] Aggiornato l'8 settembre 2026: ora 12 file `.spec.ts` (non più 7) —
  aggiunti `team-detail`, `team-roster`, `teams`, `pending-invites`,
  `invite-league` rispetto al 7 settembre. Mancano ancora test per
  `auth-api.service`, `session` (più critico ora: contiene la decodifica
  JWT per `userId`, vedi sezione 6), `auth.interceptor`, `auth.guard`,
  `players.service`, `league-detail`, `standings`, `team-trades`,
  `calendar-api.service`. La Fase 8 richiede esplicitamente test con
  `HttpTestingController` per servizi e form.

### 13.2 Da confermare (dipendono da verifica/allineamento col backend)

Non ancora impegnate come lavoro certo: verificare fattibilità e contratto
API prima di investire tempo di implementazione.

- [ ] Acquisto giocatori tramite asta. Non iniziato: solo TODO commentati
  in `players.ts` che preparano il terreno (leagueId/teamId/playerId/
  purchasePrice necessari, punto di partenza probabile dal dettaglio
  lega/squadra).
- [ ] Esecuzione scambi (trade) end-to-end. Non iniziato/rotto, vedi i bug
  di `team-trades.ts` in 13.1bis.
- [x] Invito utenti e ingresso in lega tramite invito — confermato e
  implementato, vedi nota Swagger dell'8 settembre 2026 in sezione 14.
- [x] Creazione del calendario — confermato e implementato in
  `CalendarComponent`/`CalendarApiService` (generazione una sola volta,
  gestione dei relativi error code).
- [x] Verifica/consultazione della classifica — confermato: l'endpoint
  reale è `GET /api/leagues/{leagueId}/teams` (già in sezione 10), risolto
  il mismatch documentato in 13.1bis.

### 13.3 Marginale (bassa priorità, non bloccante per l'MVP)

- [ ] **Reset password** (`/forgot-password`, `/reset-password`): il flusso
  esiste già come scaffolding minimo; non investirci lavoro finché le
  feature core sopra non sono rifinite.

### Fasi storiche (fondamenta, sostanzialmente completate)

Le fasi seguenti restano come riferimento della progettazione iniziale.
Molti punti sono già implementati dai branch mergiati: verificare lo stato
reale del codice prima di considerarli aperti o chiusi.

### Fase 0 — verifica del contratto

- [ ] Avviare backend e consultare `/v3/api-docs`.
- [ ] Confermare tipi degli ID, date, `LeagueResponse`, `UserLeagueTeamResponse`
  e campo `matchDay` di `LeagueMatchDto`.
- [ ] Salvare esempi reali delle response principali senza dati sensibili.
- [x] Concordare dove persistere il JWT: `sessionStorage` (sezione 6).
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

### Inviti: verifica Swagger dell'8 settembre 2026

- Il form nei dettagli lega si apre con “Invita membro”, solo per l'admin.
- L'invio usa `POST /api/leagues/{leagueId}/invites` con `{invitedUsername}`,
  come confermato da `/v3/api-docs`; accettazione e rifiuto usano il PATCH esistente.
- Il DTO `InviteResponse` corrente espone soltanto gli ID: per completare la
  dashboard con i nomi, il backend deve aggiungere `leagueName` e
  `invitedByUsername` alla risposta di `GET /api/invites/pending`.
  Il frontend supporta questi campi opzionali e mantiene gli ID come fallback.
- Dopo l'accettazione, l'utente viene accompagnato alla creazione della squadra.
- Build e test mirati verificano il frontend; prova con utenti reali e audit AXE
  restano da eseguire. Il backend non è incluso in questo repository.

### Formazioni (Lineup): verifica Swagger dell'8 settembre 2026

- Il backend ora espone `GET /api/lineup-type` e
  `GET/POST/PUT /api/teams/{teamId}/matches/{leagueMatchId}/lineup`, con
  request/response confermate (tipi in sezione 9, tabella in sezione 10).
  Il blocco storico "Creazione/modifica lineup" qui sotto è quindi
  **risolto**: l'endpoint esiste davvero, non è più un blocco backend.
- **Aggiornamento del 9 settembre 2026**: il DTO di
  `GET /api/leagues/{leagueId}/matches` è stato ampliato lato backend.
  Risposta reale verificata:

  ```json
  [
    {
      "id": 0,
      "roundNumber": 0,
      "matchDay": "2026-09-09T08:17:54.194Z",
      "homeTeamId": 0,
      "homeTeamName": "string",
      "awayTeamId": 0,
      "awayTeamName": "string",
      "homeScore": 0,
      "awayScore": 0,
      "homeGoals": 0,
      "awayGoals": 0,
      "matchdayClosed": true
    }
  ]
  ```

  Semantica confermata: `homeScore`/`awayScore` sono i fantapunti delle due
  squadre; `homeGoals`/`awayGoals` sono i "fantagol" derivati dallo score
  con una regola di conversione lato backend e determinano il vincitore;
  `matchdayClosed` indica se la giornata collegata è chiusa (prima della
  chiusura questi valori non sono ancora significativi). Il modello
  `CalendarMatch` (`Calendar/calendar-api.service.ts`) e il template
  (`Calendar/calendar.component.html`) sono stati aggiornati di conseguenza:
  il risultato (fantagol + fantapunti in aria-label) viene mostrato
  direttamente quando `matchdayClosed` è `true`, senza passare da
  `GET /api/lineups/{lineupId}/score`.

  Resta un solo buco, non ancora risolto:
  - **Id lineup per squadra**: mancano ancora `homeLineupId`/`awayLineupId`
    (o equivalente) nel DTO del match. Il frontend mantiene per ora i campi
    `lineupId`/`homeLineupId`/`awayLineupId` in `CalendarMatch` come
    opzionali/speculativi, insieme al vecchio flusso a bottone
    "Leggi punteggio" via `GET /api/lineups/{lineupId}/score` (tenuto per
    scelta esplicita, non più necessario per il risultato base del match ma
    potenzialmente utile per un dettaglio per-lineup in futuro).
  - Non è ancora stato verificato se POST/PUT su una lineup di matchday
    chiusa restituiscano un errore esplicito: prima di costruire la UI di
    editing formazione, usare comunque `matchdayClosed` per disabilitare il
    form in anticipo, non affidarsi solo a un eventuale errore del backend.

Questi elementi non sono implementabili soltanto nel frontend:

- [x] **Creazione/modifica lineup** — RISOLTO l'8 settembre 2026, vedi il
  blocco "Formazioni (Lineup)" sopra.
- [x] **Lettura calendario** — l'endpoint esiste ed è già usato da
  `CalendarApiService.getCalendar()`; il problema reale non era
  l'esistenza del GET ma i campi mancanti nel suo DTO, vedi punto sotto.
- [ ] **Join con invite code:** `League.inviteCode` esiste, ma nessun endpoint lo
  usa. Oggi l'ingresso avviene soltanto tramite invito nominale.
- [ ] **DTO di `GET /api/leagues/{leagueId}/matches` — buco residuo**:
  `matchdayClosed`, `homeScore`/`awayScore` e `homeGoals`/`awayGoals` sono
  stati aggiunti il 9 settembre 2026 e sono già usati dal Calendario.
  Manca ancora `homeLineupId`/`awayLineupId`. Vedi il dettaglio nel blocco
  "Formazioni (Lineup)" sopra.
- [ ] Uniformare, se possibile, il casing di `errorCode` nel backend.
- [ ] Aggiungere descrizioni OpenAPI per regole, errori e autorizzazioni.

Finché questi punti non vengono risolti, non progettare interfacce che fingano
di poter bloccare la modifica formazione a giornata chiusa o mostrare
punteggi/risultati nel Calendario.

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
