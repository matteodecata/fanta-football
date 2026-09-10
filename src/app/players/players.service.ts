import { Injectable } from "@angular/core";
import { httpResource, HttpParams, HttpResourceRef } from "@angular/common/http";
import { PageResponse, PlayerFilters, RealTeamsResponse, PriceRangeResponse} from "./players.model";


@Injectable ({
    providedIn: 'root'
})

export class PlayersService {
    // TODO META 2 - Aggiungi getRealTeamsResource per GET /api/players/real-teams.
    // Hint: segui la struttura di httpResource sotto, ma la risposta e string[] e il default e [].
    // Non leggere pagina o filtri: i bottoni devono mostrare sempre tutte le squadre.
    getRealTeamsResources(): HttpResourceRef<string[]> {
        return httpResource<string[]>(() => {
            return {
                url: '/api/players/real-teams',
                method: 'GET',
            }
        }, {
            defaultValue: []
        });
    }
    // TODO META 3 - Aggiungi getPriceRangeResource per GET /api/players/price-range.
    // Ricevi una callback che legge SOLO role, realTeamName, search e injured (vedi META 4).
    // Hint: riusa il modo di costruire HttpParams sotto, con append per i valori multipli.
    // Non inviare page, size, minPrice o maxPrice; conserva injured=false quando selezionato.
    // Usa PriceRangeResponse: senza risultati entrambi gli estremi sono null, non zero.
     getPriceRangeResource(
        readFilters: () => Pick<PlayerFilters, 'role' | 'realTeamName' | 'search' | 'injured'>
    ): HttpResourceRef<PriceRangeResponse> {
        return httpResource<PriceRangeResponse>(() => {
            const filters = readFilters();
            let params = new HttpParams();

            for (const role of filters.role) params = params.append('role', role);
            for (const team of filters.realTeamName) params = params.append('realTeamName', team);
            if (filters.search.trim()) params = params.set('search', filters.search.trim());
            if (filters.injured !== null) params = params.set('injured', filters.injured);

            return { 
                url: '/api/players/price-range', 
                method: 'GET', 
                params };
        }, {
            defaultValue: { 
                minPrice: null, 
                maxPrice: null }
        });
    }
    

    getPlayersResource(readPage: () => number, readFilters: () => PlayerFilters): HttpResourceRef<PageResponse> {
        return httpResource<PageResponse>(() => {
            const filters = readFilters();
            let params = new HttpParams().set('page', readPage()).set('size', 20);

            for (const role of filters.role) params = params.append('role', role);
            for (const team of filters.realTeamName) params = params.append('realTeamName', team);
            if (filters.search.trim()) params = params.set('search', filters.search.trim());
            if (filters.minPrice !== null) params = params.set('minPrice', filters.minPrice);
            if (filters.maxPrice !== null) params = params.set('maxPrice', filters.maxPrice);
            if (filters.injured !== null) params = params.set('injured', filters.injured);

            return { url: '/api/players', method: 'GET', params };
        }, {
            defaultValue: {
                content: [],
                totalPages: 0,
                totalElements: 0,
                page: 0,
                size: 20,
                hasNext: false,
            }
        });
    }


}
