import { HttpErrorResponse } from '@angular/common/http';

// TODO (step ApiError), parte 1: definisci l'interfaccia così come descritta
// in PROJECT_CONTEXT.md sezione 7 (due campi, entrambi string: errorCode e
// message).

// TODO: export interface ApiError { ... }
export interface ApiError {
    errorCode: string,
    message: string
}

// TODO (step ApiError), parte 2: scrivi una funzione che, dato un
// HttpErrorResponse, provi a restituire un ApiError.
//
// Firma suggerita:
//   export function extractApiError(response: HttpErrorResponse): ApiError | null
//
// Ragiona su questi punti (CLAUDE.md vieta `any`, quindi niente scorciatoie):
// - Angular tipizza `response.error` come `any`: cosa succede se il body non è
//   JSON (es. il backend è giù e risponde con testo/HTML)? Come verifichi la
//   forma dell'oggetto prima di trattarlo come un ApiError, usando `unknown`
//   invece di `any`? (questo si chiama "type guard")
// - PROJECT_CONTEXT.md dice che il casing di errorCode NON è uniforme tra i
//   vari errori: la funzione deve restituire la stringa così com'è, senza
//   normalizzarla (niente toUpperCase/toLowerCase).
// - Cosa restituisci se il body non ha la forma attesa? (da qui il tipo di
//   ritorno `ApiError | null`)
//
// Questa funzione verrà usata più avanti (Fase 2) dentro ai servizi per
// mostrare messaggi d'errore coerenti nella UI.

export function extractApiError(response: HttpErrorResponse): ApiError | null {
  // `response.error` è il body della risposta, tipizzato `any` da Angular.
  // Assegnandolo subito a una variabile `unknown` "spegniamo" quell'`any`:
  // da qui in poi TypeScript non ci lascia usare `body` come un ApiError
  // finché non lo dimostriamo con un controllo esplicito.
  const body: unknown = response.error;

  return isApiError(body) ? body : null;
}

// `value is ApiError` è una "type predicate": dice al compilatore che, se la
// funzione ritorna true, da quel punto in poi può trattare `value` come un
// ApiError. Controlliamo `typeof value === 'object' && value !== null` perché
// in JavaScript `typeof null` vale "object" (una stranezza storica del
// linguaggio) — senza quel controllo un body `null` passerebbe il test.
function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate['errorCode'] === 'string' && typeof candidate['message'] === 'string';
}