// Un JWT "standard" (JWS) non è cifrato: il payload è solo base64url + JSON,
// leggibile da chiunque abbia il token. Decodificarlo qui non espone nulla di
// nuovo (vedi PROJECT_CONTEXT.md sezione 6) — va usato solo per decisioni di
// UI, mai come controllo di autorizzazione: quello resta sempre sul backend.
export function decodeJwtPayload<T>(token: string): T | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
