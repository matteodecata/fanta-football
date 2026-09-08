import { Component, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TeamDetailService } from '../team-detail.service';

@Component({
  selector: 'app-player-release',
  imports: [],
  templateUrl: './player-release.html',
  styleUrl: './player-release.css',
})
export class PlayerRelease {
  private readonly teamDetailService = inject(TeamDetailService);

  teamId = input.required<number>();
  playerId = input.required<number>();
  released = output<void>();

  protected readonly isReleasing = signal(false);
  protected readonly releaseError = signal<string | null>(null);
  protected readonly releaseSuccess = signal<string | null>(null);

  protected async onRelease(event: Event): Promise<void> {
    event.preventDefault();
    this.releaseError.set(null);
    this.releaseSuccess.set(null);
    this.isReleasing.set(true);

    try {
      await firstValueFrom(this.teamDetailService.releasePlayer(this.teamId(), this.playerId()));
      this.releaseSuccess.set('Giocatore rilasciato con successo.');
      this.released.emit();
    } catch (error) {
      this.releaseError.set('Non è stato possibile rilasciare il giocatore.');
      console.error('Errore durante il rilascio del giocatore:', error);
    } finally {
      this.isReleasing.set(false);
    }
  }
}
