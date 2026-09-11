import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, DOCUMENT, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom, fromEvent, interval, merge } from 'rxjs';

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
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly invites = this.pendingInvitesService.pendingInvites;
  protected readonly sentInvites = this.pendingInvitesService.sentInvites;
  protected readonly activeTab = signal<'received' | 'sent'>('received');
  protected readonly processingInviteIds = signal<ReadonlySet<number>>(new Set());
  protected readonly statusMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly confirmingInviteId = signal<number | null>(null);
  protected readonly displayedInvites = computed(() =>
    this.activeTab() === 'received'
      ? this.invites.value()
      : this.sentInvites.value().filter((invite) => invite.status === 'PENDING'),
  );
  protected readonly displayedIsLoading = computed(() =>
    this.activeTab() === 'received' ? this.invites.isLoading() : this.sentInvites.isLoading(),
  );
  protected readonly displayedError = computed(() =>
    this.activeTab() === 'received' ? this.invites.error() : this.sentInvites.error(),
  );

  ngOnInit(): void {
    this.invites.reload();
    merge(interval(15_000), fromEvent(this.document, 'visibilitychange'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.document.visibilityState === 'visible'
          && !this.displayedIsLoading() && this.processingInviteIds().size === 0) {
          this.reloadActiveInvites();
        }
      });
  }

  protected selectTab(tab: 'received' | 'sent'): void {
    if (this.activeTab() === tab) {
      return;
    }

    this.actionError.set(null);
    this.activeTab.set(tab);
    if (tab === 'sent') {
      this.pendingInvitesService.enableSentInvites();
      this.sentInvites.reload();
    }
  }

  protected isProcessing(inviteId: number): boolean {
    return this.processingInviteIds().has(inviteId);
  }

  protected requestCancel(inviteId: number): void {
    if (!this.isProcessing(inviteId)) {
      this.actionError.set(null);
      this.confirmingInviteId.set(inviteId);
    }
  }

  protected dismissCancelConfirmation(): void {
    this.confirmingInviteId.set(null);
  }

  protected async cancelInvite(invite: InviteResponse): Promise<void> {
    if (this.isProcessing(invite.id) || this.confirmingInviteId() !== invite.id) {
      return;
    }

    this.beginProcessing(invite.id);

    try {
      await firstValueFrom(
        this.pendingInvitesService.cancelInvite(invite.id),
      );
      this.confirmingInviteId.set(null);
      this.statusMessage.set('Invito annullato.');
      this.sentInvites.reload();
    } catch (error: unknown) {
      this.actionError.set(this.getActionErrorMessage(error, 'annullare'));
    } finally {
      this.endProcessing(invite.id);
    }
  }

  protected reloadInvites(): void {
    this.actionError.set(null);
    this.reloadActiveInvites();
  }

  private reloadActiveInvites(): void {
    if (this.activeTab() === 'received') {
      this.invites.reload();
    } else {
      this.sentInvites.reload();
    }
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
      this.invites.reload();
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
    action: 'accettare' | 'rifiutare' | 'annullare',
  ): string {
    if (!(error instanceof HttpErrorResponse)) {
      return `Non è stato possibile ${action} l’invito. Riprova.`;
    }

    if (error.status === 401) {
      return 'La sessione è scaduta. Accedi nuovamente.';
    }

    if (error.status === 400) {
      return action === 'annullare'
        ? 'Non è possibile annullare questo invito.'
        : `Non è stato possibile ${action} l’invito.`;
    }

    if (error.status === 403) {
      return 'Non hai i permessi per gestire questo invito.';
    }

    if (error.status === 404) {
      this.reloadAfterInviteError(action);
      return 'L’invito non è più disponibile.';
    }

    if (error.status === 409) {
      this.reloadAfterInviteError(action);
      return 'Questo invito è già stato gestito.';
    }

    if (error.status === 429) {
      return 'Hai effettuato troppe operazioni. Riprova più tardi.';
    }

    return `Non è stato possibile ${action} l’invito. Riprova.`;
  }

  private reloadAfterInviteError(action: 'accettare' | 'rifiutare' | 'annullare'): void {
    if (action === 'annullare') {
      this.sentInvites.reload();
    } else {
      this.invites.reload();
    }
  }
}
