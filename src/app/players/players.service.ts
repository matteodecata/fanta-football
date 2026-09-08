import { Injectable } from "@angular/core";
import { httpResource, HttpResourceRef } from "@angular/common/http";
import { PlayerResponse } from "./players-response";


@Injectable ({
    providedIn: 'root'
})

export class PlayersService {
  
    getPlayersResource(): HttpResourceRef<PlayerResponse[]> {
        return httpResource<PlayerResponse[]>(() => ({
            url: '/api/players',
            method: 'GET',
        }), {
            defaultValue: []
        });
     }


}
