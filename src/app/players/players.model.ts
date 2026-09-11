
export type PlayerRole = 'P'|'D'|'C'|'A';

// TODO META 1 - Descrivi le nuove risposte, senza modificare PlayerResponse o PageResponse.
// Prima confronta URL e JSON effettivi del backend con quelli del prompt.
// Aggiungi PriceRangeResponse: minPrice e maxPrice possono essere numeri oppure null.
// Domanda: ["Inter", "Roma"] richiede un oggetto con content? No: per le squadre basta string[].
export interface PriceRangeResponse {
    minPrice: number | null;
    maxPrice: number | null;
}

export interface RealTeamsResponse {
    realTeams: string[];
}

export interface PlayerResponse {
    
    id: number;
    externalId: number;
    name: string;
    surname: string;
    role:   PlayerRole;
    realTeamName: string;
    realTeamShirtNum: number;
    price: number;
    injured: boolean;

}

export interface PageResponse {
    content: PlayerResponse[];
    totalPages: number;
    totalElements: number;
    page: number;
    size: number;
    hasNext: boolean;
}

export interface PlayerFilters {
    role: readonly PlayerRole[];
    realTeamName: readonly string[];
    search: string;
    minPrice: number | null;
    maxPrice: number | null;
    injured: boolean | null;
}

