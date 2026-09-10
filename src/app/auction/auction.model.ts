import { PlayerResponse } from "../players/players.model";


export interface AvailablePlayersPageResponse {
  content: PlayerResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AuctionPurchaseRequest {
  purchasePrice: number;
}