import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  InviteResponse,
  PendingInvitesService,
} from './pending-invites.service';

@Component({
  selector: 'app-pending-invites',
  imports: [DatePipe],
  templateUrl: './pending-invites.html',
  styleUrl: './pending-invites.css',
})
export class PendingInvites {
  private readonly pendingInvitesService = inject(PendingInvitesService);
  private readonly router = inject(Router);

  protected readonly invites = this.pendingInvitesService.pendingInvites;
  protected readonly processingInviteIds = signal<ReadonlySet<number>>(new Set());
  protected readonly statusMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected isProcessing(inviteId: number): boolean {
    return this.processingInviteIds().has(inviteId);
  }

  protected reloadInvites(): void {
    this.actionError.set(null);
    this.invites.reload();
  }

  protected async acceptInvite(invite: InviteResponse): Promise<void> {
    if (this.isProcessing(invite.id)) {
      return;
    }

    this.beginProcessing(invite.id);

    try {
      await firstValueFrom(
        this.pendingInvitesService.respondToInvite(invite.id, 'ACCEPTED'),
      );
      this.statusMessage.set('Invito accettato. Ora puoi creare la tua squadra.');
      await this.router.navigate(['/leagues', invite.leagueId, 'team', 'new']);
    } catch (error: unknown) {
      this.actionError.set(this.getActionErrorMessage(error, 'accettare'));
    } finally {
      this.endProcessing(invite.id);
    }
  }

  protected async rejectInvite(invite: InviteResponse): Promise<void> {
    if (this.isProcessing(invite.id)) {
      return;
    }

    this.beginProcessing(invite.id);

    try {
      await firstValueFrom(
        this.pendingInvitesService.respondToInvite(invite.id, 'DECLINED'),
      );
      this.statusMessage.set('Invito rifiutato.');
      this.invites.reload();
    } catch (error: unknown) {
      this.actionError.set(this.getActionErrorMessage(error, 'rifiutare'));
    } finally {
      this.endProcessing(invite.id);
    }
  }

  private beginProcessing(inviteId: number): void {
    this.statusMessage.set(null);
    this.actionError.set(null);
    this.processingInviteIds.update((currentIds) => {
      const updatedIds = new Set(currentIds);
      updatedIds.add(inviteId);
      return updatedIds;
    });
  }

  private endProcessing(inviteId: number): void {
    this.processingInviteIds.update((currentIds) => {
      const updatedIds = new Set(currentIds);
      updatedIds.delete(inviteId);
      return updatedIds;
    });
  }

  private getActionErrorMessage(
    error: unknown,
    action: 'accettare' | 'rifiutare',
  ): string {
    if (!(error instanceof HttpErrorResponse)) {
      return `Non è stato possibile ${action} l’invito. Riprova.`;
    }

    if (error.status === 401) {
      return 'La sessione è scaduta. Accedi nuovamente.';
    }

    if (error.status === 403) {
      return 'Non hai i permessi per gestire questo invito.';
    }

    if (error.status === 404) {
      this.invites.reload();
      return 'L’invito non è più disponibile.';
    }

    if (error.status === 409) {
      this.invites.reload();
      return 'Questo invito è già stato gestito.';
    }

    if (error.status === 429) {
      return 'Hai effettuato troppe operazioni. Riprova più tardi.';
    }

    return `Non è stato possibile ${action} l’invito. Riprova.`;
  }
}
