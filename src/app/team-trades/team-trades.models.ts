export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface TradeDto {
  id: number;
  proposingTeamId: number;
  proposingTeamName: string;
  receivingTeamId: number;
  receivingTeamName: string;
  requestedPlayerName: string;
  offeredPlayerName: string;
  amount: number;
  status: TradeStatus;
  proposalDate: string;
  leagueId: number;
  leagueName: string;
}

export interface CreateTradeDto {
  receivingTeamId: number;
  requestedPlayerId: number;
  offeredPlayerId: number;
  amount: number;
}

export interface TeamStandingResponse {
  teamId: number;
  teamName: string;
  username: string;
  budget: number;
  totalPoints: number;
}

