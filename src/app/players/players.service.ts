import { Injectable } from "@angular/core";
import { httpResource, HttpResourceRef } from "@angular/common/http";
import { PageResponse } from "./players-response";


@Injectable ({
    providedIn: 'root'
})

export class PlayersService {
    // readPage legge il signal del component: non serve una seconda copia della pagina nel service.
    getPlayersResource(readPage: () => number): HttpResourceRef<PageResponse> {
        return httpResource<PageResponse>(() => ({
            url: '/api/players',
            method: 'GET',
            params: {
                page: readPage().toString(),
                size: '20',
            }
        }), {
            defaultValue: {
                content: [],
                totalPages: 0,
                totalElements: 0,
                number: 0
            }
        });
    }


}
