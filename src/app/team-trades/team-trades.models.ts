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
}

export interface CreateTradeDto {
  receivingTeamId: string;
  requestedPlayerId: string;
  offeredPlayerId: string;
  amount: number;
}

export interface TeamStandingResponse {
  teamId: number;
  teamName: string;
  username: string;
  budget: number;
  totalPoints: number;
}

