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
