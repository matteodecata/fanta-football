export interface LeagueDetailResponse {
  id: number;
  name: string;
  budget: number;
  adminUserId: number;
  createdAt?: string;
}

export interface LeagueStandingResponse {
  teamId: number;
  teamName: string;
  username: string;
  budget: number;
  totalPoints: number;
}

export interface InviteLeagueRequest {
  username: string;
}

export interface InviteLeagueResponse {
  id: number;
  leagueId: number;
  invitedUserId: number;
  invitedByUserId: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  sentDate?: string;
}
