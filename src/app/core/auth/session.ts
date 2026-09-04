import { computed, Service, signal } from '@angular/core';
import { LoginResponse } from '../models/auth.models';

// Chiave unica sotto cui salviamo la sessione in sessionStorage. Costante di
// modulo (non di classe) perché non dipende da nessuna istanza.
const STORAGE_KEY = 'ff.session';

@Service()
export class Session {
  // Il signal parte già valorizzato leggendo da sessionStorage: così, se
  // l'utente ricarica la pagina, `state` contiene subito la sessione salvata
  // invece di partire da null e "sganciare" l'utente per un istante.
  private readonly state = signal<LoginResponse | null>(readFromStorage());

  // Stato derivato: NON un signal separato aggiornato a mano. Se avessimo
  // `isAuthenticated` come signal indipendente, ogni volta che cambiamo
  // `state` dovremmo ricordarci di aggiornare anche quello — e prima o poi
  // dimenticheremmo un punto, disallineando i due. Con `computed()`,
  // `isAuthenticated` si ricalcola da solo ogni volta che `state` cambia: non
  // può mai andare fuori sincrono.
  readonly isAuthenticated = computed(() => this.state() !== null);
  readonly token = computed(() => this.state()?.token ?? null);
  readonly roles = computed(() => this.state()?.roles ?? []);

  login(response: LoginResponse): void {
    this.state.set(response);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(response));
  }

  logout(): void {
    this.state.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

// Funzione di modulo (non un metodo): serve solo a calcolare il valore
// iniziale del signal, prima ancora che esista un'istanza di Session.
function readFromStorage(): LoginResponse | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  // JSON.parse ritorna `any`. Come per `extractApiError`, lo mettiamo subito
  // in `unknown` e lo verifichiamo con un type guard prima di fidarci: se
  // qualcuno modifica il valore a mano nei devtools (o cambiamo la forma di
  // LoginResponse in futuro), non vogliamo che l'app creda di avere un token
  // valido quando in realtà l'oggetto è corrotto o incompleto.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  return isLoginResponse(parsed) ? parsed : null;
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['token'] === 'string' &&
    Array.isArray(candidate['roles']) &&
    candidate['roles'].every((role) => typeof role === 'string')
  );
}
