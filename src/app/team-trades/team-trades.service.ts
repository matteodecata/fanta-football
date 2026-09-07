import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from "rxjs";

@Service()
export class TeamTradesService {
  private readonly http = inject(HttpClient);

  
  createTrade(trade: CreateTradeDto){
      this.http.post<TradeDto>('/api/trades', trade);
  }

  getUserTrades(): Observable<TradeDto[]>{
    return this.http.get<TradeDto[]>('/api/trades');
  }

  getLeagueTrades(id: number): Observable<TradeDto[]>{
    return this.http.get<TradeDto[]>("/api/league/" + id + "/trades");
  }

}