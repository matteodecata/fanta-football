# FantaFootball — contesto completo del progetto

Documento consolidato al **12 settembre 2026**, ricavato dalla documentazione presente e dalla lettura del codice del frontend. Serve a riprendere il lavoro senza conoscere le conversazioni precedenti.

Questo è un nuovo documento: `PROJECT_CONTEXT.md`, `AUTH_FLOW_GUIDE.md`, `README.md`, `AGENTS.md` e `CLAUDE.md` restano invariati. Non sostituisce le istruzioni operative di `AGENTS.md` né il contratto del backend.

La descrizione di una funzionalità come implementata significa che il relativo flusso è presente nel codice: non equivale a una certificazione end-to-end. Per questa ricognizione non sono stati interrogati Swagger o il backend e non è stato eseguito un nuovo audit AXE.

## Indice

**Come usare questa guida:** per capire cosa fa l'applicazione, partire dalla sezione 1 e leggere le sezioni 6–12. Per trovare dove intervenire nel codice, usare le sezioni 4–5 e i collegamenti delle singole funzionalità. Le sezioni 13–15 spiegano i dettagli tecnici; le sezioni 16–18 separano la storia del progetto dai limiti e dalle verifiche ancora necessarie.

Nelle spiegazioni seguenti, gli esempi con nomi e numeri sono illustrativi: non rappresentano dati obbligatori o valori fissi dell'applicazione.

1. [Scopo e dominio](#1-scopo-e-dominio)
2. [Fonti e loro interpretazione](#2-fonti-e-loro-interpretazione)
3. [Stack, configurazione e avvio](#3-stack-configurazione-e-avvio)
4. [Organizzazione del codice](#4-organizzazione-del-codice)
5. [Route e navigazione](#5-route-e-navigazione)
6. [Autenticazione, sessione e account](#6-autenticazione-sessione-e-account)
7. [Dashboard, leghe e inviti](#7-dashboard-leghe-e-inviti)
8. [Squadre e rose](#8-squadre-e-rose)
9. [Catalogo calciatori e asta](#9-catalogo-calciatori-e-asta)
10. [Scambi](#10-scambi)
11. [Calendario della lega](#11-calendario-della-lega)
12. [Formazioni e voti](#12-formazioni-e-voti)
13. [Mappa delle API](#13-mappa-delle-api)
14. [Modelli e identificativi](#14-modelli-e-identificativi)
15. [Stato, errori, grafica e accessibilità](#15-stato-errori-grafica-e-accessibilità)
16. [Differenze rispetto ai contesti storici](#16-differenze-rispetto-ai-contesti-storici)
17. [Limiti e verifiche residue](#17-limiti-e-verifiche-residue)
18. [Test e continuità del lavoro](#18-test-e-continuità-del-lavoro)

## 1. Scopo e dominio

### Il progetto in parole semplici

Un utente organizza un torneo di fantacalcio creando una **lega** e invitando altre persone. Ogni partecipante ha una **fantasquadra**, composta da calciatori acquistati con un budget di crediti. L'insieme dei calciatori posseduti è la **rosa**. Per ogni partita il partecipante sceglie, dalla rosa, la **formazione**: chi parte titolare e chi resta in panchina.

Il calendario divide gli incontri in **giornate**. Quando una giornata viene chiusa, l'applicazione può mostrare i risultati restituiti dal server. I partecipanti possono anche proporre scambi di calciatori.

Esempio: Giulia crea la lega “Amici” e la squadra “Alfa”. Invita Marco, che accetta e crea “Zeta”. L'amministratrice registra gli acquisti, poi entrambi scelgono la formazione per la loro partita. Alla chiusura della giornata consultano il risultato nel calendario.

### Parole da distinguere

| Termine | Significato pratico |
| --- | --- |
| Utente / fantallenatore | La persona che accede all'applicazione |
| Lega | Il gruppo nel quale si disputa un torneo |
| Fantasquadra | La squadra posseduta dall'utente in una specifica lega |
| Squadra reale | Il club del calciatore, riportato nel catalogo e nella rosa |
| Rosa | Tutti i calciatori attualmente posseduti dalla fantasquadra |
| Formazione | I titolari e le riserve scelti per una specifica partita |
| Giornata | Un gruppo di partite del calendario della lega |
| Fantapunti | Il punteggio della squadra calcolato dal backend |
| Fantagol | I gol derivati dai fantapunti e mostrati nel risultato, per esempio 2–1 |
| Crediti | Il budget con cui si acquistano calciatori e si regolano eventuali conguagli |
| Amministratore di lega | L'utente che gestisce quella lega; può essere un semplice partecipante in un'altra |

### Regole generali e responsabilità

FantaFootball è una web app di fantacalcio con frontend Angular e backend Java/Spring Boot separato. L'interfaccia è prevalentemente in italiano. Gli utenti possono registrarsi, autenticarsi, amministrare il proprio account, creare leghe, invitare altri utenti, creare una squadra, consultare rose e calciatori, gestire acquisti e scambi e schierare una formazione per una partita del calendario.

Le responsabilità di dominio descritte nei documenti storici sono:

- Un utente possiede al massimo una squadra per lega, ma può partecipare a più leghe.
- L'amministratore è contestuale alla lega: il ruolo globale del JWT non basta a identificarlo.
- La lega definisce il budget iniziale; squadre e partecipanti hanno punti e crediti propri.
- L'ingresso avviene tramite invito nominale. Accettarlo e creare la squadra sono due operazioni distinte.
- L'asta registra gli acquisti effettuati dall'amministratore per le squadre della lega.
- Gli scambi riguardano due squadre, un giocatore per parte e un eventuale conguaglio.
- Una formazione appartiene alla coppia squadra/partita e contiene titolari e riserve.
- Simulazione delle partite reali, chiusura delle giornate, subentri, calcolo dei fantapunti e dei fantagol competono al backend. La documentazione storica attribuisce l'alimentazione dei risultati a LeagueSim.

Il frontend presenta i dati e raccoglie le scelte. I permessi e le regole definitive devono essere applicati dal backend, anche quando l'interfaccia nasconde o disabilita un comando.

## 2. Fonti e loro interpretazione

| Fonte locale | Contenuto recuperato | Come leggerla oggi |
| --- | --- | --- |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Obiettivo, dominio, snapshot API, decisioni JWT, storia dei merge, roadmap, verifiche Swagger del 2–10 settembre | Contiene aggiornamenti sovrapposti e checklist non riallineate: confrontare sempre col codice |
| [AUTH_FLOW_GUIDE.md](AUTH_FLOW_GUIDE.md) | Spiegazione didattica di login, modelli, errori tipizzati, DI, Observable, sessione, interceptor e guard | Utile per capire le responsabilità; la collocazione attuale delle guard va letta nelle route |
| [AGENTS.md](AGENTS.md) | Convenzioni TypeScript/Angular e requisiti di accessibilità | Istruzioni operative del repository |
| [CLAUDE.md](CLAUDE.md) | Convenzioni analoghe per l'assistenza allo sviluppo | Riferimento di convenzioni, non inventario delle feature |
| [README.md](README.md) | Comandi e introduzione Angular CLI | Documento generico; il comando e2e citato non implica un framework e2e configurato |

Il documento storico cita anche `PROJECT-GUIDE.md` del progetto didattico `intro-angular` e `FRONTEND_API_CONTEXT.md` del backend. Questi due file non sono presenti fra i documenti Markdown individuati in questo repository: i loro contenuti sono recuperati solo attraverso i riferimenti del contesto storico, non da una nuova lettura degli originali.

Per risolvere le contraddizioni, questo documento descrive prima il comportamento osservabile nel sorgente. Le indicazioni sul backend provenienti dai vecchi documenti restano attribuite a quelle fonti e non sono presentate come una nuova verifica del servizio in esecuzione.

## 3. Stack, configurazione e avvio

Riferimenti: [package.json](package.json), [angular.json](angular.json), [tsconfig.json](tsconfig.json), [app.config.ts](src/app/app.config.ts), [proxy.conf.mjs](proxy.conf.mjs).

| Elemento | Configurazione dichiarata |
| --- | --- |
| Angular | Dipendenze principali `^22.1.0`; CLI e builder `^22.1.6` |
| TypeScript | `~6.0.2` |
| RxJS | `~7.8.0` |
| Package manager | `npm@11.17.0` |
| Test | Vitest `^4.0.8`, jsdom `^28.0.0`, builder `@angular/build:unit-test` |
| Formattazione | Prettier `^3.8.1` come dipendenza di sviluppo |
| Bootstrap | Applicazione standalone, senza `AppModule` |
| Build | `@angular/build:application`, configurazione predefinita production |

Le versioni sopra sono gli intervalli dichiarati, non una promessa sulle future risoluzioni delle dipendenze. Per un'installazione riproducibile usare il lockfile presente.

```sh
npm ci
npm start
npm run build
npm test -- --watch=false
```

Su PowerShell, se l'esecuzione di `npm.ps1` è bloccata, usare gli equivalenti `npm.cmd`, per esempio `npm.cmd run build`.

Il frontend di sviluppo usa normalmente `http://localhost:4200`. Il proxy inoltra `/api` a `http://localhost:8081`, con `secure: false` e `changeOrigin: true`; è già collegato al target `serve`. Il backend deve essere avviato separatamente. La documentazione storica indica Swagger su `http://localhost:8081/swagger-ui.html` e OpenAPI su `/v3/api-docs`.

La build produce `dist/fanta-football`. Gli asset statici provengono da `public`. Il proxy del dev server non è una configurazione di distribuzione: in produzione occorre predisporre l'inoltro delle API e la gestione delle route della SPA nell'ambiente di hosting.

`app.config.ts` registra i listener globali degli errori, il router con anchor scrolling e `HttpClient` con `authInterceptor`. Alcuni commenti TODO chiedono ancora di configurarli, ma la configurazione effettiva esiste già.

Le convenzioni richiedono TypeScript strict. Nella configurazione letta sono presenti controlli come `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictInjectionParameters` e `strictInputAccessModifiers`; non sono dichiarati esplicitamente `strict: true` e `strictTemplates: true`. Non confondere il requisito documentato con la configurazione effettivamente osservata.

## 4. Organizzazione del codice

### Come leggere i file di una funzionalità

Una stessa pagina è normalmente distribuita in più file, ognuno con uno scopo preciso:

| Tipo di file | Cosa contiene | Esempio di modifica che lo riguarda |
| --- | --- | --- |
| `.html` | Il contenuto mostrato e i controlli della pagina | Cambiare un'etichetta o spostare un pulsante |
| `.css` | Aspetto, spazi, colori e adattamento allo schermo | Allineare due elementi sulla stessa riga |
| `.ts` del componente | Le scelte dell'utente e il comportamento della pagina | Selezionare una giornata o gestire un invio |
| `.service.ts` | Servizi, spesso dedicati alle richieste al backend | Caricare inviti o inviare una proposta |
| `.models.ts` o `.model.ts` | La forma attesa dei dati | Descrivere i campi di una squadra o di uno scambio |
| `.spec.ts` | Le verifiche automatizzate presenti | Controllare che un'azione invii la richiesta corretta |

Questa divisione aiuta a orientarsi, ma non è assoluta: alcuni componenti del progetto caricano dati direttamente, senza passare da un servizio dedicato.

La struttura reale è per cartelle funzionali direttamente sotto `src/app`; la proposta storica `features/`, `shared/`, `core/layout/` non è la struttura attuale.

| Area | Responsabilità |
| --- | --- |
| `core/auth/` | API di autenticazione, stato Session, JWT, guard e interceptor |
| `core/http/` e `core/models/` | Errori API e modelli di autenticazione |
| `public-layout/`, `landing-page/` | Contenitore pubblico, navigazione pubblica e presentazione |
| `app-shell/` | Navigazione autenticata, menu account e logout |
| `login/`, `register/`, `forgot-password/`, `reset-password/` | Accesso e recupero credenziali |
| `dashboard/` | Leghe dell'utente e inviti ricevuti/inviati |
| `account/` | Modifica username/password e disabilitazione account |
| `league-create/`, `team-create/` | Creazione lega con squadra admin e squadra dopo invito |
| `league-detail/` | Classifica, calendario, partecipanti, inviti e scambi della lega |
| `teams/`, `team-detail/` | Elenco squadre, dettaglio, rosa e rinomina |
| `players/` | Catalogo paginato, ricerca e filtri backend |
| `auction/` | Registrazione degli acquisti |
| `team-trades/` | Consultazione degli scambi e servizio condiviso |
| `Calendar/` | Calendario della lega; attenzione alla C maiuscola nei percorsi |
| `lineup/` | Composizione, salvataggio e consultazione della formazione |
| `not-found/` | Pagina per route non riconosciute |

Esistono due servizi chiamati `TeamsApiService`, in cartelle diverse: quello in `team-create/` crea la squadra; quello in `teams/` fornisce risorse per leghe, squadre, rose e un helper per scaricare il catalogo completo. Controllare l'import prima di intervenire.

## 5. Route e navigazione

Fonte: [app.routes.ts](src/app/app.routes.ts). Le pagine sono caricate con `loadComponent`.

| Percorso | Contenuto |
| --- | --- |
| `/` | Redirect a `/landing` nel ramo pubblico |
| `/landing`, `/login`, `/register` | Presentazione e accesso |
| `/forgot-password`, `/reset-password` | Recupero password |
| `/dashboard` | Leghe e inviti |
| `/account` | Impostazioni account |
| `/players` | Catalogo calciatori |
| `/leagues/new` | Nuova lega |
| `/leagues/:leagueId/team/new` | Creazione squadra nella lega |
| `/leagues/:leagueId/auction` | Asta |
| `/leagues/:leagueId` | Dettaglio lega con schede |
| `/teams` | Elenco squadre con selezione lega |
| `/teams/:teamId` | Dettaglio e rosa |
| `/trades` | Scambi dell'utente attraverso le proprie squadre |
| `/leagues/:leagueId/:teamId/trades` | Scambi filtrati sulla squadra nel contesto della lega |
| `/teams/:teamId/matches/:leagueMatchId/lineup` | Formazione |
| `**` | Pagina non trovata |

`guestGuard` è applicata al contenitore pubblico: un utente autenticato viene indirizzato alla dashboard. `authGuard` è applicata al contenitore autenticato; senza sessione restituisce una destinazione login con `returnUrl`. Non sono guard specifiche per ogni permesso di business.

La route della formazione è dichiarata due volte con lo stesso path; la seconda dichiarazione è ridondante. La vecchia `/teams/:teamId/trades` è commentata, quindi non va documentata come route attiva.

Parametri di navigazione da preservare:

- `/teams?leagueId=…`: lega selezionata nell'elenco.
- `/teams/:teamId?leagueId=…`: contesto necessario soprattutto per una squadra avversaria.
- Link dal calendario alla formazione: `closed`, `leagueId`, `round`.
- Ritorno dalla formazione: `/leagues/:leagueId?section=calendar&round=…`.

La navbar autenticata collega Dashboard, Squadre, Calciatori e Scambi; gli inviti sono raggiungibili dalla dashboard. Il menu account contiene impostazioni e logout.

## 6. Autenticazione, sessione e account

### Cosa fa l'utente

Chi non ha un account si registra. Chi lo possiede apre il login, inserisce username e password e accede alla dashboard. Dal menu account può modificare le credenziali, disabilitare l'account oppure uscire. Le pagine per il recupero e la reimpostazione della password sono presenti, ma i loro form non sono ancora collegati alle chiamate API: non costituiscono attualmente un percorso completo di recupero.

### Cosa succede quando si accede

1. La pagina controlla che i campi obbligatori siano compilati.
2. Invia le credenziali al backend.
3. Se il backend le accetta, restituisce un **token**, cioè il valore che il frontend presenterà nelle richieste successive per identificare la sessione.
4. Il frontend conserva il token e apre la dashboard.
5. Se una richiesta successiva riceve un 401, la sessione viene cancellata e l'utente torna al login.

Ricaricare la pagina conserva la sessione della scheda del browser. Uscire dall'account la cancella. Un errore di permessi su una singola operazione non viene trattato automaticamente come logout.

### Dove e come è realizzato

Riferimenti principali: [Session](src/app/core/auth/session.ts), [interceptor](src/app/core/auth/auth.interceptor.ts), [Login](src/app/login/login.ts), [guida storica](AUTH_FLOW_GUIDE.md).

Il flusso di login è: form con username/password → `AuthApiService.login()` → risposta `{token, roles}` → `Session.login(response, username)` → `/dashboard`.

La sessione usa un signal e `sessionStorage`, chiave **`ff.session`**, conservando token, ruoli e username. Al caricamento legge lo storage e controlla la forma del JSON. Espone valori derivati `isAuthenticated`, `token`, `roles`, `username` e `userId`; quest'ultimo legge il claim `uid` tramite `decodeJwtPayload`.

La presenza della sessione è usata per la navigazione: `isAuthenticated` non verifica da sola firma o scadenza del token. La decodifica JWT è utile alla UI, mentre il controllo di sicurezza resta sul server.

L'interceptor allega il Bearer token alle richieste intercettate quando presente. Su 401 cancella la sessione e naviga al login; rilancia l'errore al chiamante. Il 403 non provoca automaticamente logout. L'implementazione corrente non limita l'aggiunta del token al solo prefisso `/api`.

Il logout della shell elimina la sessione locale e apre il login con `replaceUrl`; non chiama l'endpoint di logout. Secondo il contratto storico, il backend è stateless e quell'endpoint non revoca da solo il JWT.

Il login usa Signal Forms, validazione required, stato di invio, messaggi API, focus sul primo campo invalido e visibilità password. Dopo l'accesso va sempre alla dashboard: il parametro `returnUrl` prodotto dalla guard non viene ancora consumato.

Registrazione, richiesta reset e completamento reset hanno componenti e metodi API dedicati, ma solo il form di registrazione fra questi tre è collegato al servizio. La registrazione riuscita apre il login e non autentica automaticamente. Le modifiche di username/password dall'account e la disabilitazione richiedono la password corrente e gestiscono il ritorno al login. Il contesto storico indica che queste operazioni invalidano i token sul backend.

### Registrazione e recupero password: cosa avviene davvero

| Operazione | Controlli e invio | Esito attuale |
| --- | --- | --- |
| Registrazione | Controlla username, formato email e requisiti password; chiama `AuthApiService.register()` | Al successo apre `/login`; un conflitto username viene segnalato sul relativo campo |
| Richiesta recupero | Controlla che l'email sia presente e formalmente valida | Il submit scrive i dati nella console e imposta uno stato locale di conferma; **non invia la richiesta al backend** |
| Reimpostazione | Richiede codice, password di almeno otto caratteri e conferma coincidente | Il submit scrive i dati nella console; **non cambia la password sul backend** |

Il form di reimpostazione non precompila ancora il codice dal link ricevuto: parte con il campo token vuoto. I metodi `requestPasswordReset()` e `confirmPasswordReset()` del servizio sono già pronti, ma la loro sola presenza non rende operativi i due pulsanti dei form.

La modifica password dall'account è un'altra funzione: riguarda un utente già autenticato che conosce la password corrente. Non va confusa con il recupero di una password dimenticata.

### Esempio di errore nel login

Se l'utente lascia vuota la password, il controllo avviene nella pagina: non occorre chiedere al backend se le credenziali sono corrette. Se invece compila entrambi i campi, la richiesta parte e il backend può rifiutarla. In quel caso la pagina mostra il messaggio disponibile e non crea una sessione valida. Questa distinzione vale anche per gli altri form: validità dei campi e accettazione dell'operazione da parte del server sono due controlli diversi.

La guida didattica spiega la separazione da conservare: i modelli descrivono i payload; il servizio prepara richieste Observable; il componente avvia l'operazione e gestisce l'esito; Session conserva lo stato; interceptor e guard curano trasporto autenticato e navigazione.

## 7. Dashboard, leghe e inviti

### La dashboard: il punto di partenza

La dashboard riunisce due informazioni diverse: **le leghe a cui l'utente appartiene** e **gli inviti che deve ancora gestire**. Un invito ricevuto non è ancora una squadra già pronta per giocare.

In ogni card lega l'utente vede il nome della lega, il proprio ruolo, la squadra se già creata, il budget e i punti. “Dettagli lega” apre la pagina con classifica, calendario, partecipanti e scambi. Se la lega non ha ancora una squadra associata all'utente, la card lo dice esplicitamente. Se non ci sono leghe, viene proposta la creazione della prima.

### Due modi diversi di arrivare a una lega

**Creare una lega:** l'utente sceglie nome della lega, nome della propria squadra e budget iniziale. L'applicazione invia una richiesta che crea lega e prima squadra; al successo torna alla dashboard.

**Entrare in una lega esistente:** l'amministratore invia un invito usando lo username del destinatario. Il destinatario lo trova in “Ricevuti”, lo accetta e viene accompagnato alla pagina in cui crea la propria squadra. Accettare l'invito non crea automaticamente la squadra.

### Inviti ricevuti e inviati

| Vista | Cosa rappresenta | Azioni disponibili |
| --- | --- | --- |
| Ricevuti | Altri utenti hanno invitato l'utente corrente nelle loro leghe | Accettare o rifiutare |
| Inviati | L'utente corrente ha invitato qualcuno in una lega | Richiedere l'annullamento e confermarlo |

Il pannello degli inviti inviati chiede conferma prima dell'annullamento. Il pulsante “Annulla” dentro questa conferma chiude la richiesta di conferma; è “Conferma” a inviare l'annullamento dell'invito.

Le card mostrano lega, mittente o destinatario e data, quando questi dati sono disponibili. Se manca un nome, il testo visibile indica “nome non disponibile”. Durante una richiesta l'interfaccia mostra l'attesa; se il caricamento fallisce, propone “Riprova”. Una lista vuota è uno stato normale e viene spiegata, non mostrata come errore.

### Quali file gestiscono questi passaggi

| File o cartella | Responsabilità concreta |
| --- | --- |
| [user-leagues.html](src/app/dashboard/user-leagues/user-leagues.html) | Card delle leghe, dati visibili e link ai dettagli |
| [user-leagues.ts](src/app/dashboard/user-leagues/user-leagues.ts) | Ricarica delle leghe e formattazione di ruolo, budget e punti |
| [user-leagues.service.ts](src/app/dashboard/user-leagues/user-leagues.service.ts) | Lettura delle leghe dell'utente dal backend |
| [pending-invites.html](src/app/dashboard/pending-invites/pending-invites.html) | Schede Ricevuti/Inviati, card, pulsanti e conferma annullamento |
| [pending-invites.ts](src/app/dashboard/pending-invites/pending-invites.ts) | Selezione della scheda, gestione delle azioni e degli esiti |
| [pending-invites.service.ts](src/app/dashboard/pending-invites/pending-invites.service.ts) | Caricamento delle liste e richiesta di aggiornamento dello stato invito |
| `league-detail/invite-league/` | Form con cui l'amministratore invia un nuovo invito |
| `league-create/` e `team-create/` | Creazione della lega e creazione separata della squadra dopo l'invito |

### Dettagli tecnici e aggiornamento dei dati

#### Seguire una card lega dal backend allo schermo

1. `user-leagues.service.ts` espone `userLeagues`, la risorsa che legge `/api/account/me/leagues`.
2. `user-leagues.ts` usa quella stessa risorsa e ne richiede la ricarica quando il componente viene inizializzato.
3. `user-leagues.html` legge caricamento, errore e lista restituita per scegliere cosa mostrare.
4. Per ogni elemento della lista usa `item.league` per il nome, `item.admin` per il ruolo e `item.team` per squadra, crediti e punti.

Esempio: `team: null` non significa che il server non abbia risposto. Significa che l'elemento della lega non contiene ancora una squadra dell'utente; per questo esiste un messaggio specifico nella card. Analogamente, una lista vuota non è un errore di rete: significa che non ci sono leghe da presentare.

#### Seguire l'accettazione di un invito

1. Il destinatario preme “Accetta” sulla card di un invito ricevuto.
2. Il componente registra l'ID dell'invito fra quelli in elaborazione. I controlli di quella card non devono avviare di nuovo la stessa operazione.
3. Il servizio invia `PATCH /api/invites/:inviteId` con `{status: 'ACCEPTED'}`.
4. Solo quando la richiesta riesce, il componente ricarica gli inviti ricevuti e naviga alla creazione squadra nella lega indicata dall'invito.
5. L'utente inserisce il nome della squadra. Una seconda richiesta, `POST /api/teams`, crea la squadra; al successo si torna alla dashboard.

La prima richiesta cambia lo stato dell'invito; la seconda crea la squadra. Se la seconda fallisce, non si può concludere che anche l'accettazione precedente sia fallita: sono operazioni separate, non un unico salvataggio.

#### Perché un invito può cambiare mentre la pagina è aperta

Il mittente potrebbe annullarlo oppure il destinatario potrebbe averlo già gestito altrove. Il pannello ricarica la lista attiva ogni 15 secondi e quando la scheda del browser torna visibile, purché non sia già in caricamento e non ci siano azioni sugli inviti in corso. Questo è un aggiornamento periodico tramite richieste HTTP, non una connessione in tempo reale continua.

Quando si apre “Inviati”, il servizio abilita il caricamento della relativa lista; la UI mostra solo gli elementi `PENDING`. “Ricevuti” usa direttamente l'elenco dell'endpoint dedicato agli inviti in sospeso.

| Risposta durante un'azione | Come viene spiegata | Aggiornamento |
| --- | --- | --- |
| 403 | Non ci sono i permessi per gestire l'invito | Mostra l'errore |
| 404 | L'invito non è più disponibile | Ricarica la lista interessata |
| 409 | L'invito è già stato gestito | Ricarica la lista interessata |
| 429 | Sono state effettuate troppe operazioni | Invita a riprovare più tardi |

#### Cosa contiene il dettaglio della lega

Le quattro schede rispondono a domande differenti: **Classifica** mostra i punti delle squadre; **Calendario** mostra chi gioca contro chi e i risultati; **Partecipanti** mostra i fantallenatori; **Scambi** raccoglie proposte e azioni di mercato della lega. Classifica e Partecipanti possono usare la stessa risposta backend, ma la presentano con uno scopo diverso.

La dashboard presenta le leghe da `/api/account/me/leagues` attraverso `UserLeaguesService`: ogni elemento contiene `league`, `team` eventualmente nullo e `admin`. Le card mostrano informazioni della squadra, punti, crediti e accesso ai dettagli della lega.

Il servizio conserva una risorsa condivisa, ma `UserLeagues.ngOnInit()` ora esegue `reload()`. La segnalazione storica secondo cui il rientro dalla creazione non ricaricava mai le leghe non descrive più questo comportamento.

La creazione lega invia `{name, teamName, budget}`, con budget iniziale del form pari a 500 e validazione minima a 1. Al successo torna alla dashboard. La creazione squadra dopo invito usa una richiesta separata a `/api/teams`.

Nel dettaglio lega sono presenti quattro schede: **Classifica, Calendario, Partecipanti, Scambi**. Classifica e partecipanti usano `/api/leagues/:leagueId/teams`; il componente ordina per `totalPoints` decrescente. L'admin viene riconosciuto confrontando `adminUserId` con `Session.userId()`. La squadra dell'utente per il calendario viene individuata confrontando lo username della sessione con gli elementi della classifica.

L'admin vede “Gestisci asta” e “Invita membro”. L'invito è nominale, tramite `{invitedUsername}`. In dashboard si possono consultare gli inviti ricevuti e quelli inviati; la risorsa degli inviati viene abilitata quando richiesta. Sono presenti accettazione, rifiuto e annullamento degli inviti inviati. Dopo l'accettazione si naviga alla creazione squadra nella lega.

Il modello inviti include `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELLED`. I nomi (`leagueName`, `invitedByUsername`, `invitedUsername` e altri campi compatibili) sono opzionali: non assumere che tutte le risposte li forniscano. La documentazione storica descrive la necessità di estendere questi DTO; il frontend contempla fallback.

## 8. Squadre e rose

### Cosa vede l'utente

Da “Squadre” sceglie la lega, cerca una squadra per nome o fantallenatore e ne apre il dettaglio. La rosa è una tabella dei calciatori posseduti: non è la formazione scelta per una giornata.

Esempio: un calciatore pagato 15 crediti può avere oggi una quotazione diversa. Nella colonna “Crediti pagati” della rosa si vede comunque il prezzo d'acquisto di 15. Se in seguito il calciatore viene trasferito, non deve più comparire fra quelli attivi.

La tabella non offre più azioni per riga. Questa è una scelta grafica esplicita: chi riprende il progetto non deve reintrodurre “Azioni” soltanto perché trova ancora il componente di svincolo nei sorgenti.

### Dati, permessi e file coinvolti

#### Dal nome della squadra alla sua rosa

Se l'utente apre una squadra, il dettaglio deve prima capire a quale lega appartiene. Per questo i link conservano `leagueId`: il solo numero della squadra non offre al componente tutte le informazioni necessarie per ricostruire il contesto di un'avversaria.

Una volta risolta la lega, la pagina cerca la squadra nella lista delle squadre della lega e carica separatamente i calciatori della rosa. Nome, punti e budget non vengono ricostruiti sommando i dati della tabella giocatori.

La rinomina, quando disponibile per il proprietario, modifica il nome tramite PATCH. Il componente di rinomina emette l'evento `updated` dopo la risposta positiva: è una comunicazione al componente che lo contiene, non una seconda chiamata di modifica del nome.

#### Interpretare correttamente una riga

Supponiamo che la relazione di rosa abbia `id=501`, `playerId=80`, `purchasePrice=15` e `transferDate=null`. È il calciatore 80, attualmente posseduto dalla squadra e acquistato per 15 crediti. Il numero 501 identifica quella specifica relazione di possesso: sarà usato come `teamPlayerId` nella formazione. Non è il numero da usare per indicare il calciatore in un acquisto o in una proposta scambio.

Riferimenti: [Teams](src/app/teams/teams.ts), [TeamDetail](src/app/team-detail/team-detail.ts), [TeamRoster](src/app/team-detail/team-roster/team-roster.html).

L'elenco squadre permette di scegliere una lega e filtrare localmente per nome squadra o fantallenatore. Se esiste una sola lega, viene selezionata automaticamente. Il query parameter `leagueId` conserva il contesto nei collegamenti.

Il dettaglio ricava appartenenza e dati da `/api/account/me/leagues` e `/api/leagues/:leagueId/teams`, senza affidarsi a `GET /api/teams/:teamId`, endpoint segnalato come assente dalla verifica storica. Per la propria squadra può risolvere la lega anche attraverso la membership; per le altre è importante il parametro di contesto.

La rosa proviene da `/api/teams/:teamId/players` e mostra solo relazioni con `transferDate === null`. Le colonne attuali sono esattamente:

1. Calciatore.
2. Ruolo.
3. Squadra reale.
4. Fantamedia.
5. Crediti pagati.

**La colonna “Azioni” e i pulsanti di svincolo sono stati rimossi dalla tabella per scelta dell'utente.** Il componente `player-release/` e la relativa logica restano nel repository, ma non sono più renderizzati dalla rosa. La rinomina della propria squadra resta una funzione separata.

Il ruolo deriva dal campo **`playerRole`** della relazione squadra/giocatore. I crediti pagati sono `purchasePrice`, non il prezzo attuale del catalogo. La fantamedia è indicata come “Non disponibile”, con spiegazione dedicata: non viene inventata né ricavata dai singoli voti disponibili.

Il 403 sulla rosa produce un messaggio esplicito di accesso negato. I contesti storici attribuiscono la lettura al proprietario/admin; l'effettiva consultabilità delle rose avversarie dipende dal backend e influisce anche sul flusso di proposta scambio.

## 9. Catalogo calciatori e asta

### Catalogo

**Uso pratico:** la pagina “Calciatori” serve a trovare e confrontare i giocatori. L'utente può, per esempio, cercare gli attaccanti di una o più squadre reali entro un certo prezzo. Cambiare filtro richiede al backend un nuovo insieme di risultati; i pulsanti di pagina servono a consultare il resto dell'elenco.

Il catalogo descrive i calciatori, mentre l'acquisto viene registrato nella pagina Asta della lega. Sono due flussi distinti.

Riferimenti: [Players](src/app/players/players.ts), [PlayersService](src/app/players/players.service.ts).

Il catalogo attuale usa **paginazione e filtri lato backend**, con pagine da 20 elementi. Non scarica più tutto il catalogo per applicare localmente i filtri della pagina `/players`.

Supporta ricerca testuale, più ruoli, più squadre reali, prezzo minimo/massimo e filtro infortunio. I valori multipli sono inviati con parametri ripetuti `role` e `realTeamName`. `injured=false` è conservato come filtro valido, distinto da assenza del filtro.

Le squadre reali arrivano da `/api/players/real-teams` come `string[]`. L'intervallo prezzi arriva da `/api/players/price-range`, filtrato per ruolo, squadra, ricerca e infortunio, senza pagina né filtri prezzo. Estremi null significano assenza di un intervallo disponibile, non prezzo zero.

Gli slider distinguono valori temporanei e confermati; cambiare i filtri principali azzera il filtro prezzo e riporta alla pagina iniziale. La UI mantiene le righe precedenti durante il caricamento successivo. “Aggiorna” ricarica catalogo e metadati. I suggerimenti di ricerca derivano dalla pagina restituita e sono limitati a cinque.

L'helper `TeamsApiService.players()` esiste ancora e concatena tutte le pagine con RxJS `expand`/`reduce`, richiedendo `size=100`. Non va confuso con l'attuale servizio della pagina catalogo.

#### Esempio completo di ricerca con filtri

L'utente seleziona il ruolo Attaccante e una squadra reale. `Players` aggiorna le selezioni e riporta la pagina a zero; `PlayersService` invia i filtri a `/api/players`. La risposta contiene solo una pagina dei risultati, insieme al numero totale di pagine e all'indicazione se ne esiste una successiva.

In parallelo, il servizio richiede l'intervallo prezzi valido per quei filtri. Se i giocatori disponibili costano da 5 a 30, gli slider devono usare quell'intervallo. Se l'utente cambia squadra, un precedente prezzo minimo di 50 non viene mantenuto come vincolo nascosto: il filtro prezzo viene azzerato.

Muovere uno slider aggiorna prima il valore provvisorio mostrato. Quando la selezione viene confermata, il prezzo entra nei filtri usati dalla richiesta. Passare alla pagina successiva conserva i filtri; cambiarli riporta alla prima pagina.

### Asta

**Uso pratico:** dal dettaglio lega l'amministratore apre “Gestisci asta”, seleziona la fantasquadra destinataria, cerca il calciatore e indica il prezzo concordato. L'applicazione controlla i dati e invia la registrazione dell'acquisto. Non è un sistema di offerte in tempo reale: il flusso presente registra un acquisto già deciso.

Esempio: se una squadra ha 100 crediti e l'acquisto ne costa 20, l'interfaccia può mostrare un budget residuo previsto di 80. L'acquisto diventa effettivo solo dopo la risposta positiva del backend; una previsione grafica non modifica da sola il budget.

L'asta è implementata in [Auction](src/app/auction/auction.ts). Carica le squadre della lega e i calciatori disponibili da `/api/leagues/:leagueId/players/available`, permette di scegliere squadra, calciatore e prezzo e registra l'acquisto tramite `AuctionService`.

Il prezzo deve essere positivo e compatibile con il budget della squadra. La ricerca propone fino a cinque calciatori dopo almeno due caratteri. Al successo il form viene azzerato e vengono ricaricati squadre e disponibili. I conflitti `budget_too_low` e `player_already_owned` hanno gestione specifica.

Limite del codice attuale: la risposta dei disponibili è paginata, ma il componente usa soltanto `content` della richiesta iniziale, senza passare pagina né iterare le successive. La ricerca locale copre quindi solo i dati ricevuti, non necessariamente tutti i disponibili nella lega.

#### Perché il backend può rifiutare un acquisto apparentemente valido

Il budget mostrato è quello dell'ultima risposta ricevuta. Nel frattempo un'altra operazione potrebbe aver consumato crediti o assegnato lo stesso calciatore. Per questo il controllo nel form è utile, ma la conferma finale spetta al backend.

Con `budget_too_low` la pagina ricarica le squadre e azzera il prezzo; con `player_already_owned` azzera il calciatore selezionato e ricarica i disponibili. L'obiettivo è permettere una nuova scelta basata sui dati aggiornati, senza presentare l'acquisto rifiutato come riuscito.

## 10. Scambi

### Come usarli

La voce “Scambi” della navigazione permette di consultare le proposte relative alle proprie squadre. Per creare una proposta o rispondere a uno scambio, si usa la scheda “Scambi” dentro il dettaglio della lega.

Per proporre uno scambio si sceglie la squadra destinataria, il suo giocatore richiesto, il proprio giocatore offerto e l'eventuale differenza in crediti. Dopo l'invio la proposta resta in attesa finché viene gestita.

Esempio di conguaglio: Alfa offre un calciatore a Zeta in cambio di un altro. Con importo `10`, Alfa propone anche di pagare 10 crediti; con `-10`, chiede che sia Zeta a pagarli; con `0`, non propone un trasferimento di crediti. Questa è la convenzione del contratto storico, da mantenere coerente con il backend.

### Come leggere gli stati

| Stato tecnico | Testo mostrato | Significato |
| --- | --- | --- |
| `PENDING` | In attesa | La proposta deve ancora essere definita |
| `ACCEPTED` | Accettato | La proposta è stata accettata |
| `REJECTED` | Rifiutato | La proposta è stata rifiutata |
| `CANCELLED` | Annullato | La proposta non è più attiva; può essere diventata incompatibile con un altro scambio |

La squadra ricevente può accettare. Le due parti possono rifiutare. Mostrare uno scambio nello storico non significa che sia ancora possibile agire su di esso.

### Organizzazione tecnica

#### Esempio di proposta e risposta

Alfa vuole il calciatore di Zeta: nella scheda Scambi della lega seleziona Zeta, sceglie il giocatore richiesto dalla sua lista e quello offerto dalla propria. Il frontend verifica che le selezioni appartengano alle liste caricate. Cambiare destinatario azzera il giocatore richiesto, perché la scelta precedente apparteneva a un'altra squadra.

Alla conferma viene inviato POST `/api/trades`. Al successo il form viene ripulito e l'elenco viene ricaricato: il nuovo elemento viene letto dal server, non considerato accettato automaticamente. Zeta può quindi accettare la proposta, mentre Alfa la ritrova fra quelle inviate in attesa.

Quando Zeta accetta, il frontend invia soltanto lo stato della decisione. Non scambia direttamente gli elementi di due array di rosa e non sottrae crediti localmente: trasferimenti, budget e compatibilità con altre proposte sono responsabilità del backend. Per questo viene ricaricata l'intera lista degli scambi e non soltanto cambiata l'etichetta di una card.

Sono presenti due interfacce complementari.

**`TeamTrades`**, pagina `/trades` o `/leagues/:leagueId/:teamId/trades`, consulta gli scambi con schede Ricevuti, Inviati e Storico. Nella vista generale ricava le squadre da `/api/teams/me`; in quella contestuale usa gli identificativi della route e i dati della lega. Ricevuti e inviati includono solo `PENDING`; lo storico include gli altri stati relativi alle squadre considerate. Questa pagina è di consultazione.

**`LeagueTrades`**, nella scheda Scambi del dettaglio lega, carica tutti gli scambi della lega e consente di proporre e rispondere. Determina la propria squadra dall'elenco restituito da `/api/teams/me`, filtrato per lega; esclude le proprie squadre dai destinatari e carica le rose delle due parti.

La proposta invia `receivingTeamId`, `requestedPlayerId`, `offeredPlayerId`, `amount`. Il modello frontend conserva attualmente gli ID della proposta come stringhe provenienti dalle select. La verifica di selezione usa conversioni numeriche; il payload inviato resta quello del modello.

Secondo il contratto storico, un conguaglio positivo è pagato dal proponente, uno negativo dal ricevente. La proposta richiede selezioni presenti nelle liste caricate e un importo finito.

Solo la squadra ricevente può accettare un `PENDING`; entrambe le parti possono rifiutarlo. Il PATCH invia `ACCEPTED` o `REJECTED`. Dopo creazione o risposta vengono ricaricati gli scambi, anche perché uno scambio accettato può rendere incompatibili altre proposte.

La ricarica corrente dopo una risposta riguarda gli scambi: non è una invalidazione generale di rose, crediti e classifiche già caricati altrove. Inoltre le liste giocatori della proposta non applicano esplicitamente il filtro `transferDate === null` usato nella rosa e nella formazione; non presumere equivalenza senza controllare la risposta backend.

Il vecchio `currentTeamId = 1` e il submit privo di chiamata API non descrivono più il flusso attuale. Parte dell'accesso HTTP rimane direttamente in `LeagueTrades` tramite `httpResource` e `HttpClient`, mentre altre operazioni passano da `TeamTradesService`.

## 11. Calendario della lega

### Come si usa

Nel dettaglio della lega si apre la scheda “Calendario”. Se il calendario manca, l'amministratore può generarlo. Quando è disponibile, ogni giornata raggruppa le sue partite.

Per andare alla giornata vicina si usano “Precedente” e “Successiva”. Per saltare direttamente dalla prima all'ultima si usa “Vai alla giornata”. La scelta cambia le partite mostrate, non crea una nuova giornata.

Esempio completo: l'utente sceglie la giornata 2, trova la propria squadra e preme “Schiera formazione”. Se cambia idea nella pagina della formazione, preme “← Torna alla giornata”: si riapre il calendario della stessa lega sulla giornata 2, senza salvare le selezioni.

### Partita aperta e partita chiusa

| Situazione | Cosa mostra il calendario | Cosa può fare l'utente |
| --- | --- | --- |
| Giornata aperta | Squadre e messaggio che il risultato sarà disponibile alla chiusura | Aprire “Schiera formazione” accanto alla propria squadra |
| Giornata chiusa | Risultato e link “Vedi formazione” associati alle due squadre | Consultare i dati consentiti dal backend |

“Chiusa” è uno stato ricevuto dal backend. Non viene deciso confrontando semplicemente la data della partita con l'orologio del browser.

### Implementazione e disposizione grafica

#### Come si passa dalle partite ricevute alla giornata visibile

Il backend restituisce una lista di partite. Ogni partita indica il proprio `roundNumber`: il componente raccoglie insieme quelle con lo stesso numero e ordina i gruppi. Se riceve quattro partite con `roundNumber=2`, la giornata 2 mostra quelle quattro partite.

La select non richiede al backend di generare altri incontri: seleziona un gruppo già presente nella lista caricata. “Precedente” e “Successiva” cambiano lo stesso indice usato dalla select; per questo i tre controlli restano coerenti fra loro.

Il numero di partite, il numero di giornate e l'indice della giornata selezionata sono grandezze diverse. Per esempio, una lega può avere 38 giornate con più partite in ciascuna: “38 giornate” non significa “38 partite”.

Riferimenti: [CalendarComponent](src/app/Calendar/calendar.component.ts), [template](src/app/Calendar/calendar.component.html), [servizio](src/app/Calendar/calendar-api.service.ts).

Il calendario è incluso nel dettaglio lega. Carica le partite con GET e permette all'admin di generarle una sola volta con POST quando lo stato è `not-generated`. Non costruisce risultati o giornate fittizie sul client.

Le partite sono raggruppate per `roundNumber`, ordinate per numero giornata; date iniziale/finale sono ricavate dai `matchDay` del gruppo. Viene visualizzata una giornata alla volta. Il numero di giornate deriva dalla risposta, **non è fissato a 38**.

La navigazione mantiene “Precedente” e “Successiva” e aggiunge **“Vai alla giornata”**, una select che consente il salto diretto a qualunque gruppo disponibile. I pulsanti vengono disabilitati agli estremi. Gli indici interni partono da zero, ma i nomi delle opzioni usano `roundNumber`.

Per le partite chiuse la disposizione richiesta è:

```text
Squadra A [Vedi formazione]     risultato     Squadra B [Vedi formazione]
```

I pulsanti sono associati ai rispettivi nomi, con spazio ai lati del risultato. Su contenitori stretti la disposizione si adatta e i pulsanti possono stare sotto i nomi. Le etichette accessibili dei link includono la squadra, anche se il testo visibile è uguale.

Quando `matchdayClosed` è vero, il risultato usa `homeGoals`/`awayGoals`. I fantapunti `homeScore`/`awayScore` sono inclusi nella descrizione accessibile del risultato. I collegamenti “Vedi formazione” vengono proposti per entrambe le squadre; la possibilità effettiva di caricare i loro dati dipende dai permessi API.

Nelle giornate aperte il link **“Schiera formazione” compare vicino alla propria squadra**, sia in casa sia in trasferta. Il testo informativo separato è esattamente **“Il risultato sarà disponibile alla chiusura della giornata”**.

Il risultato di base non dipende dagli ID delle formazioni. Il modello conserva `lineupId`, `homeLineupId`, `awayLineupId` opzionali; il vecchio pulsante “Leggi punteggio” viene considerato solo se esiste `lineupId`, usando `/api/lineups/:lineupId/score`. Non presumere che il backend valorizzi questi campi opzionali.

Stati principali: caricamento, pronto, calendario assente, già generato, nessuna giornata aperta ed errore. Una lettura 404 viene interpretata come calendario non generato. Sono gestiti codici come `calendar_already_generated`, `no_open_matchday`, `no_open_matchdays` e `matchday_not_closed`.

### Ritorno dalla formazione alla stessa giornata

Il calendario passa `closed`, `leagueId` e `round` nel link della formazione. Quest'ultima verifica che lega e giornata siano interi positivi prima di mostrare il collegamento di ritorno.

Il collegamento visibile è **“← Torna alla giornata”**, senza numero, allineato a destra sulla stessa riga della piccola intestazione “Formazione”, sopra “Schiera la formazione”. Non salva la formazione.

La destinazione contiene `section=calendar&round=…`: il dettaglio apre la scheda Calendario e passa `initialRound` al componente. Il `linkedSignal` individua la giornata anche quando le partite arrivano dopo la richiesta asincrona; se non la trova, usa la prima.

Il ritorno esplicito è distinto dalla cronologia del browser. I pulsanti precedente/successiva e la select cambiano lo stato locale senza sincronizzare continuamente l'URL. Un refresh generico non garantisce il ripristino dell'ultima scelta manuale; il flusso esplicito formazione → calendario conserva invece la giornata passata nel link.

## 12. Formazioni e voti

### Come si schiera la formazione

1. Si apre la pagina dal pulsante della propria squadra nel calendario.
2. Si sceglie un modulo: determina quanti difensori, centrocampisti e attaccanti servono.
3. Si sceglie un solo portiere titolare e si completano gli altri ruoli richiesti.
4. Si scelgono le riserve fra i calciatori rimasti fuori dai titolari.
5. Si preme “Crea formazione” se è la prima, oppure “Aggiorna formazione” se esiste già.

Se mancano i titolari richiesti, il salvataggio non è disponibile e la pagina spiega i conteggi da completare. Se l'utente vuole uscire, usa il collegamento in alto a destra. Le selezioni fatte a schermo diventano dati salvati soltanto dopo l'invio riuscito.

### Come si consulta una giornata chiusa

La pagina mostra la formazione senza consentire modifiche e carica i voti disponibili. “N/D” significa che non c'è un voto; non significa che il giocatore abbia preso zero. Le etichette chiariscono chi era titolare, in panchina o fuori formazione.

### Dati e regole implementate

#### Esempio di formazione 4–3–3

Se il catalogo backend offre il modulo 4–3–3, l'utente deve scegliere un portiere, quattro difensori, tre centrocampisti e tre attaccanti. Il modulo definisce quanti giocatori servono per ruolo; non sceglie i loro nomi al posto dell'utente.

La pagina conteggia i titolari separatamente per ruolo. Avere undici nomi selezionati non sarebbe sufficiente se la distribuzione non rispettasse il modulo. Quando un ruolo raggiunge il numero previsto, non si può aggiungere un altro titolare di quel ruolo senza liberare un posto. Il portiere usa una scelta singola: selezionarne un altro sostituisce quello precedente.

Le riserve vengono selezionate fra i giocatori non titolari. Scegliere un giocatore come riserva non aumenta il conteggio richiesto dei titolari. Portarlo poi fra i titolari lo rimuove dalla selezione panchina, evitando che venga inviato con entrambi i ruoli.

#### Cosa viene salvato e cosa resta soltanto nella pagina

Le scelte vivono inizialmente nei signal del componente. Il submit prepara una richiesta contenente l'ID del modulo, il flag difensivo e l'elenco dei giocatori con `starter=true` per i titolari e `starter=false` per le riserve. I giocatori non scelti non entrano in quell'elenco.

La prima formazione usa POST; una formazione già caricata o appena creata con successo usa PUT per i salvataggi successivi. La conferma “Formazione salvata” dipende dalla risposta del backend. Uscire senza inviare non modifica una formazione salvata in precedenza e non conserva una nuova bozza per il rientro.

Il parametro `closed=true` decide la modalità di consultazione del frontend. Il backend deve verificare lo stato reale anche se qualcuno modifica manualmente l'indirizzo: un parametro di navigazione è modificabile dall'utente e non può autorizzare un salvataggio.

Riferimenti: [Lineup](src/app/lineup/lineup.ts), [modelli](src/app/lineup/lineup.models.ts), [servizio](src/app/lineup/lineup.service.ts).

La pagina carica moduli, rosa e formazione eventualmente già esistente per `teamId` e `leagueMatchId`. Il servizio converte una risposta 404 sulla lettura della formazione in `null`, usata come assenza di formazione.

La rosa selezionabile esclude i trasferiti e i ruoli non riconosciuti. I ruoli sono `P`, `D`, `C`, `A`. La disponibilità minima della rosa e i conteggi del modulo determinano se è possibile salvare.

Il modulo espone **`defenderNum`, `midfielderNum`, `forwardNum`**. Il numero di portieri titolari è sempre uno, ma **l'identità del portiere deve essere selezionata** ed essere inclusa nella richiesta. L'affermazione storica “il portiere non va scelto” è superata.

La selezione del portiere è singola; difensori, centrocampisti e attaccanti rispettano i conteggi del modulo. La panchina contiene giocatori non titolari, portieri inclusi. Se un giocatore diventa titolare viene rimosso dalla selezione panchina; quelli non scelti restano fuori formazione.

La request contiene `lineupTypeId`, `defensive`, `players: [{teamPlayerId, starter}]`. Alla creazione si usa POST, all'aggiornamento PUT. Il salvataggio richiede un portiere e i conteggi D/C/A previsti. La UI descrive una formazione di undici titolari; la somma dei tre conteggi dipende dal catalogo moduli backend.

Il valore `defensive` nel codice corrente è vero con **più di tre difensori e un portiere**. Il commento vicino parla ancora di cinque difensori: per descrivere l'implementazione usare l'espressione effettiva e verificare separatamente la regola concordata con il backend.

Lo stato di chiusura della UI deriva da `closed=true` nel query parameter. A giornata chiusa i controlli e il submit sono bloccati e vengono caricati i voti da `/players/ratings`. Questo parametro non è una garanzia di autorizzazione: l'API deve comunque verificare ownership e chiusura reale della giornata.

I voti riguardano la rosa attiva e possono essere null. `null` viene presentato come `N/D`, non come zero; i valori numerici sono formattati con una cifra decimale. La UI distingue Titolare, Panchina e Fuori formazione. I subentri e il punteggio finale non sono calcolati dal componente.

Il ritorno al calendario può essere usato senza creare o aggiornare la formazione. Non è presente un salvataggio automatico delle selezioni né una conferma di uscita per modifiche non salvate.

## 13. Mappa delle API

Questa tabella registra le chiamate del frontend e i contratti recuperati dalle fonti. I payload completi vanno letti nei modelli collegati alle feature; l'esistenza di una chiamata nel client non certifica una nuova verifica live del server.

| Area | Metodo e percorso | Dati/uso |
| --- | --- | --- |
| Accesso | POST `/api/auth/login` | `{username,password}` → `{token,roles}` |
| Registrazione | POST `/api/auth/register` | `{username,email,password}` |
| Reset | POST `/api/auth/forgot-password` | `{email}`; metodo del servizio presente, form non collegato |
| Reset | POST `/api/auth/reset-password` | `{token,newPassword}`; metodo del servizio presente, form non collegato |
| Account | GET `/api/account/me/leagues` | Membership, squadra e flag admin |
| Account | PATCH `/api/account/me/username` | `{newUsername,currentPassword}` |
| Account | PUT `/api/account/me/password` | `{currentPassword,newPassword}` |
| Account | DELETE `/api/account/me` | Body con `currentPassword` |
| Lega | POST `/api/leagues` | `{name,teamName,budget}` |
| Lega | GET `/api/leagues/:leagueId` | Dettaglio e `adminUserId` |
| Squadre/classifica | GET `/api/leagues/:leagueId/teams` | Squadre, username, budget e punti |
| Squadra | POST `/api/teams` | `{teamName,leagueId}` |
| Squadre utente | GET `/api/teams/me` | Squadre possedute |
| Rinomina | PATCH `/api/teams/:teamId` | `{name}` |
| Rosa | GET `/api/teams/:teamId/players` | Relazioni squadra/calciatore |
| Svincolo | DELETE `/api/teams/:teamId/players/:playerId` | Codice conservato, comando rimosso dalla tabella rosa |
| Invito | POST `/api/leagues/:leagueId/invites` | `{invitedUsername}` |
| Inviti | GET `/api/invites/pending`, GET `/api/invites/sent` | Ricevuti e inviati |
| Inviti | PATCH `/api/invites/:inviteId` | `{status}`: accettazione, rifiuto, annullamento |
| Catalogo | GET `/api/players` | `page`, `size`, `role`, `realTeamName`, `search`, `minPrice`, `maxPrice`, `injured` |
| Metadati catalogo | GET `/api/players/real-teams` | Array di nomi |
| Metadati catalogo | GET `/api/players/price-range` | `{minPrice,maxPrice}`, entrambi nullable |
| Asta | GET `/api/leagues/:leagueId/players/available` | Risposta paginata dei disponibili |
| Acquisto | POST `/api/leagues/:leagueId/teams/:teamId/players/:playerId` | `{purchasePrice}` |
| Scambi | GET `/api/trades` | Scambi dell'utente |
| Scambi lega | GET `/api/leagues/:leagueId/trades` | Scambi della lega |
| Proposta | POST `/api/trades` | Destinatario, giocatori, importo |
| Risposta scambio | PATCH `/api/trades/:tradeId` | `{status: 'ACCEPTED' o 'REJECTED'}` |
| Calendario | GET e POST `/api/leagues/:leagueId/matches` | Lettura e generazione |
| Moduli | GET `/api/lineup-types` | Catalogo moduli |
| Formazione | GET, POST, PUT `/api/teams/:teamId/matches/:leagueMatchId/lineup` | Lettura, creazione, aggiornamento |
| Voti | GET `/api/teams/:teamId/matches/:leagueMatchId/players/ratings` | Voti per relazione squadra/calciatore |
| Punteggio opzionale | GET `/api/lineups/:lineupId/score` | `{score,goals}` |

Altri contratti recuperati dal contesto storico, da non confondere con pagine correnti: POST `/api/auth/logout`; GET `/api/teams/:teamId/trades` con combinazioni `scope=history` oppure `status=pending&direction=received|sent`; GET `/api/players/:playerId/matchdays/:matchdayId/rating`. Le attuali viste scambi usano invece le liste utente/lega e filtri nel componente.

La documentazione storica segnala come non utilizzabili per nuove feature `/api/public/**`, POST `/api/registration-requests` e l'ingresso tramite invite code, perché non associati a controller/flussi disponibili nello snapshot ricevuto. Verificare il contratto attuale prima di considerarli implementabili.

## 14. Modelli e identificativi

| Concetto | Campi da non confondere |
| --- | --- |
| Calciatore di catalogo | `PlayerResponse.id`, `role`, `price` |
| Calciatore nella rosa | `TeamPlayerResponse.id` identifica la relazione; `playerId` identifica il calciatore; il ruolo è `playerRole` |
| Richiesta formazione | Usa `teamPlayerId`, cioè l'ID della relazione, non `playerId` |
| Acquisto, svincolo, scambio | Usano il calciatore `playerId` |
| Partita della lega | `CalendarMatch.id`, passato nella route come `leagueMatchId` |
| Giornata visualizzata | `roundNumber`, distinto dall'indice zero-based della navigazione |
| Data partita | `matchDay`, stringa o numero opzionale nel modello corrente; non un ID di giornata reale |
| Risultato | `homeGoals/awayGoals`: fantagol; `homeScore/awayScore`: fantapunti |
| Prezzo | `price`: quotazione catalogo; `purchasePrice`: crediti effettivamente pagati |
| Voto e fantamedia | `fantaRating`: voto per partita, nullable; fantamedia aggregata non fornita alla rosa |

`PageResponse` contiene `content`, `page`, `size`, `totalElements`, `totalPages`, `hasNext`. Il campo è **`page`**, non `number`. Il servizio calendario tollera un array diretto o un oggetto con `matches`/`calendar`.

`ApiError` usa `errorCode` e `message`. I codici storici hanno casing non uniforme: non normalizzarli indiscriminatamente. Il generico TypeScript di `HttpClient` descrive il payload atteso, ma non valida automaticamente il JSON ricevuto a runtime.

## 15. Stato, errori, grafica e accessibilità

### Piccolo glossario tecnico

| Termine | Spiegazione in questo progetto |
| --- | --- |
| Frontend | L'applicazione Angular che gira nel browser e mostra le pagine |
| Backend | Il servizio separato che conserva i dati e applica le regole del gioco |
| API / endpoint | Un indirizzo al quale il frontend invia una richiesta di dati o un'operazione |
| GET / POST / PUT / PATCH / DELETE | Metodi HTTP: lettura, creazione/invio, aggiornamento, modifica e rimozione; l'effetto esatto dipende dall'endpoint |
| Payload / DTO | I dati scambiati nella richiesta o nella risposta, per esempio nome e budget della lega |
| Route | Il percorso di una pagina, per esempio `/dashboard` |
| Query parameter | Un valore dopo `?` nell'indirizzo, usato per conservare contesto come `round=2` |
| Signal | Un valore osservabile: quando cambia, Angular può aggiornare la parte di pagina che lo usa |
| `computed` | Un valore ricavato automaticamente da altri valori, come il conteggio dei titolari |
| `linkedSignal` | Uno stato modificabile che si riallinea quando cambiano le sorgenti da cui dipende |
| Resource | Un oggetto che espone dati caricati, caricamento ed errore; `reload()` ne richiede l'aggiornamento |
| Observable | Un flusso di valori o esiti asincroni; per le richieste HttpClient una sottoscrizione ne avvia l'esecuzione |
| Guard | Un controllo del router che decide se una navigazione può proseguire |
| Interceptor | Un passaggio comune alle richieste HTTP, qui usato per token ed errori 401 |
| 401 / 403 / 404 / 409 | Richiesta non autenticata / non consentita / risorsa non trovata / conflitto, con significato preciso da leggere nel contesto API |
| Build | Compilazione dell'applicazione; il suo successo non prova ogni comportamento nel browser |
| Test end-to-end | Verifica di un percorso completo dell'utente attraverso l'applicazione |
| AXE / WCAG | Strumenti di controllo e requisiti per rendere l'interfaccia accessibile |

### Come cambiano i dati mostrati

Un esempio aiuta a collegare i termini: quando l'utente sceglie un ruolo nel catalogo, cambia un signal. Il filtro derivato viene ricalcolato; la resource richiede al backend i risultati aggiornati. Nel frattempo il componente può mostrare il caricamento. Alla risposta aggiorna la tabella; in caso di errore mostra il messaggio previsto.

Per un'azione come accettare un invito, invece, l'applicazione invia prima la modifica. Solo dopo il successo aggiorna le liste e prosegue con la navigazione. Premere il pulsante e completare l'operazione sono due momenti distinti.

### Convenzioni e implementazione attuale

Il progetto usa signals per selezioni e stati locali, `computed` per valori derivati e `linkedSignal` per selezioni da riallineare ad altre sorgenti. `httpResource` e `rxResource` gestiscono letture reattive; `HttpClient`, subscribe e `firstValueFrom` gestiscono diverse operazioni imperative.

Le convenzioni di `AGENTS.md` richiedono componenti standalone, `inject`, input/output funzionali, `model` per veri binding bidirezionali, control flow nativo, aggiornamenti immutabili e Signal Forms per i nuovi form. Chiedono inoltre di evitare `any`, `NgModule`, decorator storici per input/host, `ngClass` e `ngStyle`; immagini statiche tramite `NgOptimizedImage`. I nuovi singleton devono seguire la preferenza documentata per `@Service`. Non aggiungere esplicitamente `standalone: true` o OnPush nei decorator.

Il sorgente conserva stili di implementazione diversi e commenti didattici. Non assumere che tutte le convenzioni siano già applicate ovunque.

Gli errori sono presentati con stati espliciti di caricamento, vuoto, fallimento e successo. `extractApiError` controlla payload non fidati attraverso `unknown` e type guard; alcune feature usano messaggi generici o estrattori locali. Un 403 indica un problema di permessi, non automaticamente una sessione scaduta.

Il design usa [src/styles.css](src/styles.css) per token di colore, spaziatura, tipografia, pulsanti, tabelle, form, badge e alert, più CSS per feature. Calendario e altre pagine usano layout responsive, incluse container query. Non è dichiarata una libreria UI esterna nelle dipendenze principali.

Sono presenti etichette, tabelle semantiche, stati live, focus dei titoli alla navigazione e gestione tastiera delle schede del dettaglio lega. La shell gestisce chiusura del menu account con Escape e ripristino del focus. Tuttavia **WCAG AA e superamento AXE sono requisiti, non risultati di audit attestati da questo documento**.

## 16. Differenze rispetto ai contesti storici

| Affermazione o piano storico | Stato rilevato nel codice attuale |
| --- | --- |
| Calendario orfano/non collegato | Incluso nel dettaglio lega |
| Stato chiusura e risultati assenti | `matchdayClosed`, fantapunti e fantagol sono modellati e mostrati |
| Formazioni ancora da realizzare | Composizione, POST/PUT e consultazione voti presenti |
| Portiere implicito e non selezionabile | Uno obbligatorio, scelto esplicitamente e incluso nel payload |
| Moduli con `numDefenders` e simili | I modelli correnti usano `defenderNum`, `midfielderNum`, `forwardNum` |
| Ruolo rosa recuperato dal catalogo/denominato `role` | Il codice della rosa usa `playerRole` direttamente |
| Catalogo filtrato tutto sul client | Pagina `/players` con filtri e paginazione backend, più endpoint metadati |
| Asta non iniziata | Pagina e registrazione acquisto implementate |
| Scambi con team fisso e submit vuoto | Viste utente/lega/squadra e proposta reale in `LeagueTrades` |
| Link navbar Scambi verso dashboard | Link attuale `/trades` |
| Nessuna ricarica leghe al ritorno | `UserLeagues.ngOnInit()` ricarica la risorsa |
| Membri rimossi perché ridondanti | Scheda Partecipanti presente accanto a Classifica |
| Svincolo nella colonna Azioni | Colonna e pulsanti rimossi per scelta grafica dell'utente |
| Solo avanzamento sequenziale calendario | Select per salto diretto alla giornata |
| Nessun ritorno dalla formazione | Link esplicito con contesto lega/giornata |

Le checklist storiche restano utili per ricostruire le decisioni, ma non vanno eseguite come se ogni voce non spuntata fosse ancora da implementare.

## 17. Limiti e verifiche residue

Questa sezione registra limiti osservati o verifiche non effettuate. Non costituisce autorizzazione a modificarli automaticamente.

- **Fantamedia:** la colonna resta senza dato aggregato; serve un contratto backend adeguato.
- **Recupero password:** i form forgot/reset non chiamano ancora i metodi API disponibili; il messaggio locale del primo non dimostra l'invio di un'email. Il codice di reset non viene letto automaticamente dall'URL. I submit conservano inoltre log dei dati immessi, inclusi quelli del reset: descrivere questi componenti come incompleti, non come un recupero operativo.
- **Asta:** ricerca limitata al `content` della pagina iniziale dei disponibili finché non viene gestita la paginazione completa.
- **Permessi su rose e formazioni avversarie:** i link esistono, ma i GET possono fallire se il backend limita l'accesso. Verificare con utenti reali, anche per le proposte di scambio.
- **Chiusura formazione:** la UI si basa sul query parameter; una pagina già aperta non riceve automaticamente un nuovo stato di chiusura dal calendario. Il backend deve applicare la regola definitiva.
- **Formazione assente:** il servizio tratta ogni 404 della GET come assenza, senza distinguere squadra/partita inesistente da formazione mai creata.
- **Bonus difensivo:** commento e condizione differiscono; la condizione corrente è D > 3 con un portiere.
- **Scambi:** la ricarica dopo risposta non aggiorna tutte le altre risorse condivise; le rose della proposta non sono filtrate esplicitamente per trasferimento.
- **Ritorno calendario:** disponibile se `leagueId` e `round` sono validi nel link. Non è una persistenza universale della posizione su ogni refresh o accesso diretto.
- **Sessione/login:** `returnUrl` non utilizzato; nessuna validazione locale della scadenza nella proprietà `isAuthenticated`.
- **Accessibilità:** `src/index.html` conserva `lang="en"` benché la UI sia italiana; nei template delle due shell letti non è presente uno skip link. Focus dopo dati asincroni e contrasto richiedono verifica effettiva.
- **Configurazione strict:** i flag principali strict non sono dichiarati esplicitamente nei file TypeScript letti, nonostante il requisito nelle convenzioni.
- **Pulizia tecnica:** route formazione duplicata, commenti TODO superati, elementi conservati dopo cambi di UI (come lo svincolo) e accesso HTTP non sempre incapsulato nei servizi.
- **Localizzazione:** la UI usa testi italiani, ma il provider globale della locale italiana non risulta configurato in `app.config.ts`; alcuni formati sono esplicitamente `it-IT`, altri dipendono da `LOCALE_ID`.
- **Punteggi per lineup:** gli ID opzionali nel calendario non sono garantiti dallo snapshot backend documentato; il risultato base resta indipendente da questi campi.

L'ultima build eseguita nella sessione prima della redazione di questo documento è riuscita. Ha segnalato il superamento del budget di avviso CSS di 4 kB per `Calendar/calendar.component.css` (circa 4,34 kB) e `team-trades/team-trades.css` (circa 5,27 kB). Il limite di errore per stile componente è 8 kB; il budget iniziale è 500 kB di avviso e 1 MB di errore. Questi dati non sono una misura dei tempi di caricamento reali.

## 18. Test e continuità del lavoro

Al momento della ricognizione sono presenti **17 file `.spec.ts`**: app, shell pubblica/autenticata, landing, dashboard, inviti ricevuti e invito lega, squadre, dettaglio squadra, rosa, creazione squadra, players, asta, formazione, scambi lega e servizi di modifica username/password.

La presenza di un file non certifica la copertura della feature. In particolare il test della formazione è ancora un semplice test di creazione del componente. Non risultano file di test dedicati per Session, interceptor, guard, calendario e pagina `TeamTrades` nell'inventario letto. Alcuni test potrebbero riflettere UI o contratti precedenti e vanno confrontati prima di usarli come prova dello stato attuale.

Per questa attività documentale non sono stati eseguiti test applicativi né modificati codice o test. Le build riuscite della sessione precedente non attestano il superamento dell'intera suite Vitest. Il README cita `ng e2e`, ma `angular.json` non contiene un target e2e configurato.

Per una verifica funzionale successiva, percorrere almeno: login → creazione lega → invito → accettazione e creazione squadra → asta → rosa → calendario → scelta di una giornata lontana → formazione → ritorno alla stessa giornata; aggiungere consultazione di una partita chiusa e proposta/risposta di scambio con due utenti distinti. Verificare separatamente tastiera, mobile, AXE, API negate e sessione scaduta.

Per riprendere lo sviluppo:

1. Leggere `AGENTS.md` e questo documento; usare gli altri contesti per storia e motivazioni.
2. Controllare lo stato dei file reali e delle modifiche locali prima di intervenire.
3. Verificare sul backend il contratto di una chiamata che si vuole cambiare; non inventare endpoint o dati mancanti.
4. Distinguere identificativi di calciatore, relazione di rosa, partita e giornata.
5. Conservare le scelte UI esplicite descritte per calendario, ritorno dalla formazione e colonne della rosa.
6. Mantenere separate responsabilità di presentazione, sessione e trasporto, senza introdurre librerie non necessarie.
7. Eseguire verifiche proporzionate alla modifica e registrare risultati effettivi, senza dichiarare chiuse verifiche mai svolte.
8. Per richiesta dell'utente, lasciare invariati i contesti storici: eventuali aggiornamenti a questa sintesi vanno mantenuti nel nuovo documento.

Questo documento fotografa il frontend disponibile nel workspace al momento della lettura, includendo le modifiche della sessione, senza presumere che siano già state committate, pubblicate o distribuite.
