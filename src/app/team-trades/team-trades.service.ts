import { httpResource } from "@angular/common/http";
import { Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class UserLeaguesService {
  /*
  readonly userLeagues = httpResource<UserLeagueTeamResponse[]>(() => '/api/account/me/leagues', {
    defaultValue: [],
  });
  */

  createTrade(trade: CreateTradeDto){
    
  }

}