import { Injectable, computed, signal } from '@angular/core';

export interface Session {
  readonly token: string;
  readonly roles: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storageKey = 'fanta-football.session';
  private readonly sessionState = signal<Session | null>(this.readSession());
  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);

  setSession(session: Session): void {
    this.sessionState.set(session);
    sessionStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clear(): void {
    this.sessionState.set(null);
    sessionStorage.removeItem(this.storageKey);
  }

  hasRole(role: string): boolean {
    const expected = role.toUpperCase().replace(/^ROLE_/, '');
    return this.sessionState()?.roles.some((item) => item.toUpperCase().replace(/^ROLE_/, '') === expected) ?? false;
  }

  private readSession(): Session | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      if (typeof value !== 'object' || value === null || !('token' in value) || !('roles' in value)) return null;
      const candidate = value as { token: unknown; roles: unknown };
      return typeof candidate.token === 'string' && Array.isArray(candidate.roles) && candidate.roles.every((role) => typeof role === 'string')
        ? { token: candidate.token, roles: candidate.roles }
        : null;
    } catch {
      return null;
    }
  }
}
