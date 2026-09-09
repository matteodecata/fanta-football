import { PlayerRole } from '../players/players-response';

export interface LineupTypeResponse {
  id: number;
  numDefenders: number;
  numMidfielders: number;
  numForwards: number;
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
