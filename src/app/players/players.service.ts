import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PlayerFilters, PlayerResponse } from "./players-response";


@Injectable ({
    providedIn: 'root'
})

export class PlayersService {
    private http = inject(HttpClient);
    private playerUrls = "/api/players" ;


     getPlayers(filters?: PlayerFilters) {
        const params: Record<string, string> = {};

        if (filters?.role) {
            params['role'] = filters.role;
        }

        if (filters?.realTeamName.trim()) {
            params['realTeamName'] = filters.realTeamName.trim();
        }

        if (filters?.minPrice !== null && filters?.minPrice !== undefined) {
            params['minPrice'] = String(filters.minPrice);
        }

        if (filters?.maxPrice !== null && filters?.maxPrice !== undefined) {
            params['maxPrice'] = String(filters.maxPrice);
        }

        if (filters?.injured !== null && filters?.injured !== undefined) {
            params['injured'] = String(filters.injured);
        }

        return this.http.get<PlayerResponse[]>(this.playerUrls, { params });
    }
}
