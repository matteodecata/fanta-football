import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

export type UserLeagueRole = 'admin' | 'participant';
export type UserLeagueStatus = 'draft' | 'active' | 'completed';

export interface UserLeague {
  id: string;
  name: string;
  role: UserLeagueRole;
  participantsCount: number;
  maxParticipants: number;
  status: UserLeagueStatus;
}

@Service()
export class UserLeaguesService {
  readonly userLeagues = httpResource<UserLeague[]>(
    () => '/api/leagues/mine',
    { defaultValue: [] },
  );
}
