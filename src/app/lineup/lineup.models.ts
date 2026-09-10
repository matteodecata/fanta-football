import { PlayerRole } from '../players/players-response';

export interface LineupTypeResponse {
  id: number;
  defenderNum: number;
  midfielderNum: number;
  forwardNum: number;
}

export interface LineupPlayerRequest {
  teamPlayerId: number;
  starter: boolean;
}

export interface LineupPlayerResponse {
  teamPlayerId: number;
  playerId: number;
  name: string;
  surname: string;
  role: PlayerRole;
  starter: boolean;
}

export interface LineupRequest {
  lineupTypeId: number;
  defensive: boolean;
  players: LineupPlayerRequest[];
}

export interface LineupResponse {
  id: number;
  teamId: number;
  leagueMatchId: number;
  lineupTypeId: number;
  defensive: boolean;
  players: LineupPlayerResponse[];
}

// GET /api/teams/{teamId}/matches/{leagueMatchId}/players/ratings — un
// elemento per ogni giocatore della rosa attiva, non solo chi era in
// formazione. `fantaRating` è nullable: null non è un errore, significa
// "nessun voto disponibile" (giornata non chiusa, o il giocatore reale non
// ha giocato quella partita simulata) — va mostrato come "-"/"N/D", mai come 0.
export interface PlayerRatingResponse {
  teamPlayerId: number;
  playerId: number;
  name: string;
  surname: string;
  role: PlayerRole;
  fantaRating: number | null;
}
