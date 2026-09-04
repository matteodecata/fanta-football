// TODO (step modelli): definisci qui i tipi per le richieste/risposte di
// autenticazione. Guarda PROJECT_CONTEXT.md, sezione 9 ("Modelli TypeScript da
// creare") per la forma esatta dei campi.
//
// Ti servono 4 interfacce:
// - LoginRequest    { username, password }
// - LoginResponse   { token, roles[] }
// - CreateUserRequest { username, email, password }
// - UserDto         { id, username, enabled, roles[] }
//
// Domanda per capire il concetto: perché conviene avere un'interfaccia separata
// per la request e una per la response (es. LoginRequest vs LoginResponse)
// invece di un'unica interfaccia "Auth" con tutti i campi opzionali?
// 
// Per poter lavorare sui dati che effetivamente riceviamo, inoltre dovremmo salvare i dati
// nel dto di richiesta il che non è una buona prassi, mentre avendoli separati possiamo dividere
// il flusso del lavoro. inoltre i campi che utlizziamo possono essere diversi da quelli che abbiamo come in questo caso
//
// Nota: qui mettiamo solo i modelli di autenticazione, perché sono quelli che ti
// servono subito per collegare le form già pronte (login, register). Gli altri
// domini (team, player, invite, trade, calendario) li affronteremo più avanti,
// quando arriveremo alle fasi corrispondenti della roadmap in PROJECT_CONTEXT.md.

// TODO: export interface LoginRequest { ... }
export interface LoginRequest {
    username: string,
    password: string
}

// TODO: export interface LoginResponse { ... }
export interface LoginResponse {
    token: string,
    roles: string[]
}

// TODO: export interface CreateUserRequest { ... }
export interface CreateUserRequest {
    username: string,
    email: string,
    password: string
}
// TODO: export interface UserDto { ... }
export interface UserDto {
    id: number,
    username: string,
    enabled: boolean,
    roles: string[]
}
