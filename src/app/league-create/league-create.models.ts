export interface CreateLeagueRequest {
  name: string;
  teamName: string;
  budget: number;
}

export interface LeagueResponse {
  id: number;
  name: string;
  inviteCode: string;
  adminUserId: number;
  creationDate: string;
  budget: number;
}
