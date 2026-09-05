
export type PlayerRole = 'P'|'D'|'C'|'A';

export interface PlayerResponse {
    id : number;
    externalId : number;
    name : string;
    surname : string;
    role :   PlayerRole;
    realTeamName : string;
    realTeamShirtNum : number;
    price : number;
    injured : boolean;

}

export interface PlayerFilters {
    role: PlayerRole | '';
    realTeamName: string;
    minPrice: number | null;
    maxPrice: number | null;
    injured: boolean | null;
}
