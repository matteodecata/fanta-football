export interface CreateTeamRequest {
  teamName: string;
  leagueId: number;
}

export interface TeamResponse {
  id: number;
  name: string;
  userId: number;
  leagueId: number;
  leagueName: string;
  budget: number;
  totalPoints: number;
}