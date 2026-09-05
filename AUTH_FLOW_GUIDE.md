# Guida al flusso di login — cosa abbiamo costruito e perché

> Riferimento di studio per il flusso di autenticazione (Fase 2). Non duplica
> il codice: rimanda ai file reali, spiega solo i concetti Angular/TypeScript
> usati e perché ogni pezzo esiste.

## Panoramica del flusso

```
Login (componente)
   -> AuthApiService.login()        HTTP POST /api/auth/login
        -> authInterceptor          aggiunge Authorization se c'è un token
             -> backend Spring Boot
   <- Observable<LoginResponse>
   -> Session.login(response)       salva stato + sessionStorage
   -> router.navigateByUrl('/dashboard')
```

Ogni pezzo ha UNA responsabilità: i modelli descrivono i dati, il service
parla HTTP, la sessione tiene lo stato, l'interceptor allega il token e
gestisce il logout automatico, il componente orchestra tutto e mostra la UI.

## 1. Modelli — [`core/models/auth.models.ts`](src/app/core/models/auth.models.ts)

Interfacce TypeScript pure (`LoginRequest`, `LoginResponse`, ecc.), request e
response **separate** anche quando sembrano simili: la request è "cosa mando
io" (io decido i campi), la response è "cosa mi manda il backend" (non li
controllo). Tenerle unite con campi opzionali toglierebbe a TypeScript la
possibilità di segnalare un campo required dimenticato.

## 2. Errori tipizzati — [`core/http/api-error.ts`](src/app/core/http/api-error.ts)

`HttpErrorResponse.error` (il body di un errore HTTP) è tipizzato `any` da
Angular. Il pattern usato per "domare" un valore non fidato è sempre lo
stesso, e torna 3 volte in questo flusso:

1. Assegnalo a una variabile `unknown` (spegne l'`any`, TS blocca ogni uso finché non lo dimostri).
2. Scrivi una funzione `is<Qualcosa>(value: unknown): value is <Qualcosa>` — una **type predicate**: se ritorna `true`, da lì in poi TS tratta il valore come quel tipo.
3. Dentro, controlla `typeof`/`Array.isArray` sui campi che ti servono (mai `toUpperCase()`/normalizzazioni: `errorCode` va restituito così com'è).

Stesso pattern riusato in `session.ts` (`isLoginResponse`, per leggere
`sessionStorage` senza fidarsi ciecamente del contenuto).

## 3. Service HTTP — [`core/auth/auth-api.service.ts`](src/app/core/auth/auth-api.service.ts)

- **`@Service()`**: decorator Angular 22 che registra la classe come
  singleton nell'injector root — scorciatoia per
  `@Injectable({ providedIn: 'root' })`.
- **`inject(HttpClient)`**: funzione che recupera una dipendenza dal DI
  container, alternativa moderna al constructor injection. Va chiamata come
  inizializzatore di campo (o comunque in un punto sincrono dentro un
  contesto di injection).
- **Perché ritorna `Observable<T>` invece di fare `subscribe()` internamente**:
  un Observable è un flusso *non ancora partito* finché nessuno si iscrive.
  Se il service si iscrivesse da solo, il chiamante perderebbe il controllo
  su quando parte la richiesta, se può annullarla, e riceverebbe un valore
  invece di poter reagire a successo/errore separatamente.
- **`http.post<LoginResponse>(url, body)`**: il generico dice a TypeScript la
  forma della risposta attesa. Per risposte 204 (nessun corpo) si usa
  `post<void>(...)`.

## 4. Stato di sessione — [`core/auth/session.ts`](src/app/core/auth/session.ts)

- **`signal<LoginResponse | null>(...)`**: lo stato osservabile e mutabile.
  Inizializzato leggendo subito `sessionStorage`, non `null`, così un
  refresh della pagina non disconnette l'utente.
- **`computed(() => ...)`**: stato **derivato**, che si ricalcola da solo
  quando il signal sorgente cambia (`isAuthenticated`, `token`, `roles`). Mai
  un signal parallelo aggiornato "a mano": andrebbe prima o poi fuori
  sincrono con lo stato reale.
- **`sessionStorage`**: scelto (invece di `localStorage`/memoria) perché il
  backend non ha cookie HttpOnly; sopravvive al refresh ma sparisce alla
  chiusura della tab (decisione in `PROJECT_CONTEXT.md` sezione 6).
  `login()`/`logout()` scrivono **sia** nel signal (reattività UI) **sia**
  nello storage (persistenza).

## 5. Interceptor funzionale — [`core/auth/auth.interceptor.ts`](src/app/core/auth/auth.interceptor.ts)

- Un **interceptor funzionale** è solo una funzione `(req, next) => Observable<...>`,
  registrata con `provideHttpClient(withInterceptors([authInterceptor]))` in
  `app.config.ts`. Con più interceptor nell'array, l'ordine conta: sulla
  richiesta vengono eseguiti nell'ordine dichiarato (ognuno vede le modifiche
  di chi viene prima), sulla risposta l'ordine si inverte (onion: l'ultimo ad
  aver toccato la richiesta è il primo a vedere la risposta).
- **`inject()` dentro un interceptor** va chiamato in modo sincrono all'inizio
  della funzione, mai dentro una callback asincrona (es. dentro `.pipe(...)`)
  — lì il contesto di injection non è più garantito.
- **`req.clone({...})`**: `HttpRequest` è immutabile, non si modificano gli
  header direttamente; si crea una copia con le modifiche.
- **`pipe()` e `catchError`**: un `Observable` rappresenta un flusso nel
  tempo; `pipe()` incatena *operatori* (funzioni RxJS) che trasformano quel
  flusso senza mutarlo, ognuno ritorna un nuovo Observable. `catchError`
  intercetta un errore che attraversa il flusso: qui, se è uno
  `HttpErrorResponse` con `status === 401`, fa logout + redirect; **in ogni
  caso** rilancia l'errore con `throwError(() => err)`, altrimenti chi ha
  fatto la richiesta (il componente) non saprebbe mai che è fallita. Il 403
  viene **volutamente** lasciato passare senza logout (può essere un divieto
  di ownership, non una sessione scaduta — vedi `PROJECT_CONTEXT.md` sezione 6).

## 6. Il componente — [`login/login.ts`](src/app/login/login.ts) + [`login.html`](src/app/login/login.html)

- **Signal Forms** (`form()`, `required()`, `[formField]`): `form(this.credentials, (path) => {...})`
  crea un albero di campi reattivi legato al signal `credentials`; i
  validatori (`required`) si dichiarano per singolo path. `loginForm().invalid()`
  e `loginForm.username().touched()` leggono lo stato di validazione.
- **`viewChild('usernameInput')`**: riferimento tipizzato a un elemento del
  template (via `#usernameInput`), usato qui solo per spostare il focus sul
  primo campo non valido dopo un submit fallito (accessibilità da tastiera).
- **`inject(AuthApiService)` / `inject(Session)` / `inject(Router)`**: le tre
  dipendenze di cui il componente ha bisogno per orchestrare il flusso.
- **`.subscribe({ next, error })`**: il punto in cui il componente *decide*
  di far partire la richiesta (il service l'aveva solo preparata come
  Observable) e reagisce ai due esiti possibili.
- **Stati espliciti** (`submitting`, `errorMessage` come signal): il bottone
  si disabilita e cambia testo durante la richiesta, l'errore compare in un
  `<p role="alert">` — `role="alert"` include un `aria-live="assertive"`
  implicito, quindi gli screen reader lo annunciano appena compare, senza
  bisogno di aggiungerlo a mano.

## 7. Guard di rotta — [`core/auth/auth.guard.ts`](src/app/core/auth/auth.guard.ts)

Flusso quando si naviga su una rotta protetta (es. `/players`) senza sessione:

```
Router (navigazione a /players)
   -> authGuard(route, state)         CanActivateFn eseguita PRIMA di caricare il componente
        -> session.isAuthenticated()  legge lo stesso Session di core/auth/session.ts
   -> true                            se autenticato: la navigazione prosegue
   -> UrlTree('/login?returnUrl=...') se no: redirect, il componente non viene mai istanziato
```

- **Cos'è una guard**: una funzione che il Router interpella prima di
  attivare (o lasciare) una rotta, per decidere se la navigazione può
  procedere. Ne esistono più tipi (`CanActivateFn`, `CanDeactivateFn`,
  `CanMatchFn`, ...); qui usiamo `CanActivateFn`, quella che intercetta "posso
  ENTRARE in questa rotta?".
- **Dove si registra**: nell'array `canActivate: [authGuard]` di ogni rotta
  da proteggere, dentro [`app.routes.ts`](src/app/app.routes.ts). Non è una
  configurazione globale: va ripetuta su ogni rotta protetta (qui: dashboard,
  account, players, leagues/\*, teams/\*).
- **Firma**: `CanActivateFn = (route, state) => boolean | UrlTree | Observable<...> | Promise<...>`.
  Il Router aspetta il risultato prima di procedere:
  - `true` → naviga normalmente;
  - `false` → naviga bloccata senza redirect (non usato qui: bloccare "a
    vuoto" un utente non loggato, senza spiegazione, sarebbe peggio di un
    redirect al login);
  - una `UrlTree` → il Router **reindirizza** a quell'url al posto della
    rotta richiesta, senza dover chiamare `router.navigate()` a parte.
- **`inject(Session)` / `inject(Router)`**: stessa regola vista per
  l'interceptor (sezione 5) — l'injection va fatta in modo sincrono
  all'inizio della funzione guard, perché il contesto di injection è valido
  solo per la durata di quella chiamata.
- **Perché deve leggere lo stesso `Session` usato da login e interceptor**:
  `Session` è un singleton (`@Service()`, root injector), quindi guard,
  interceptor e componente `Login` condividono la stessa istanza e lo stesso
  `signal` di stato. Se la guard leggesse lo stato da un altro service (o da
  un'altra chiave di `sessionStorage`), potrebbe non vedere mai il login
  appena effettuato e bloccare per sempre un utente autenticato — è
  esattamente il bug capitato dopo il merge delle branch, quando esisteva un
  secondo `SessionService` parallelo (in un vecchio `src/app/auth/`,
  rimosso) con stato indipendente da quello scritto da `login.ts`.
- **`state.url` e `returnUrl`**: `state.url` è l'URL completo che si stava
  tentando di raggiungere (es. `/players`). Viene passato come query param
  (`createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })`)
  così, dopo il login, si potrebbe riportare l'utente lì invece che sempre
  alla dashboard. **Nota**: `login.ts` non legge ancora questo query param
  (naviga sempre a `/dashboard`) — pezzo lasciato apposta da implementare:
  andrebbe letto con `inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl')`
  nel componente `Login` e usato al posto di `/dashboard` nel `next` della
  `subscribe`.
- **`createUrlTree` invece di `router.navigate()`**: dentro una guard si
  preferisce **restituire** una `UrlTree` (prodotta da
  `router.createUrlTree(...)`) piuttosto che chiamare `router.navigate()` e
  poi restituire `false`: `createUrlTree` non avvia subito una navigazione,
  produce solo il valore che il Router userà per il redirect nello stesso
  ciclo di navigazione, evitando una doppia navigazione.

## Da riusare per Register / Forgot-password / Reset-password

Stesso schema del componente `Login`: signal di stato (`submitting`,
`errorMessage`), chiamata al metodo corrispondente di `AuthApiService`,
`.subscribe({next, error})`, `extractApiError` per il messaggio, redirect o
messaggio di conferma al successo. Cambia solo *cosa* fare in `next` (es.
`register` non fa `session.login()`, perché non riceve un token).
