type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

interface TradeDto {
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

interface CreateTradeDto {
  receivingTeamId: string;
  requestedPlayerId: string;
  offeredPlayerId: string;
  amount: number;
}

interface Player {
  id: number;
  name: string;
}
