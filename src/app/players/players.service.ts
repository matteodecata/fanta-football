import { Injectable } from "@angular/core";
import { httpResource, HttpResourceRef } from "@angular/common/http";
import { PlayerFilters, PlayerResponse } from "./players-response";


@Injectable ({
    providedIn: 'root'
})

export class PlayersService {
  
    getPlayersResource(filters: () => PlayerFilters): HttpResourceRef<PlayerResponse[]> {

        return httpResource<PlayerResponse[]>(() =>
        ({
            url: '/api/players',
            method: 'GET',
            params: this.toParams(filters()),
         }), {
            defaultValue: [],
        });
     }


    private toParams(filters: PlayerFilters): Record<string, string> {
        const params: Record<string, string> = {};

        if (filters.role) {
            params['role'] = filters.role;
        }

        if (filters.realTeamName.trim()) {
            params['realTeamName'] = filters.realTeamName.trim();
        }

        if (filters.minPrice !== null) {
            params['minPrice'] = String(filters.minPrice);
        }

        if (filters.maxPrice !== null) {
            params['maxPrice'] = String(filters.maxPrice);
        }

        if (filters.injured !== null) {
            params['injured'] = String(filters.injured);
        }

        return params;
    }
}
