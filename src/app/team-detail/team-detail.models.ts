import { PlayerRole } from '../players/players-response';

export interface TeamDetailResponse {
  id: number;
  name: string;
  userId: number;
  leagueId: number;
  leagueName: string;
  budget: number;
  totalPoints: number;
}

export interface TeamPlayerResponse {
  id: number;
  teamId: number;
  playerId: number;
  name: string;
  surname: string;
  // Aggiunto lato backend il 10 settembre 2026: prima andava recuperato
  // incrociando `/api/players` (l'intero catalogo) per playerId, cosa
  // diventata anche problematica con la paginazione introdotta sullo stesso
  // endpoint. Ora arriva già qui, niente più chiamata aggiuntiva.
  playerRole: PlayerRole;
  realTeamName: string;
  realTeamShirtNum: number;
  injured: boolean;
  purchaseDate: string;
  transferDate: string | null;
  purchasePrice: number;
}

export interface RenameTeamRequest {
  name: string;
}
