import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, retry, shareReplay, timeout } from 'rxjs';
import {
  BrapiQuoteResponse,
  InternalDividendEntry,
  InternalDividendYieldResponse,
  InternalHistoricalIndicatorsResponse,
  InternalStockPriceItem,
  InvestidorIndicatorsEntry,
  SaveHistoricalDataPayloadItem,
  StockAutocompleteItem,
} from '../models/api.models';
import { environment } from '../../environments/environment';

interface CacheEntry<T> {
  expiresAt: number;
  stream$: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private readonly memoryCache = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly http: HttpClient) {}

  searchStocks(term: string): Observable<StockAutocompleteItem[]> {
    const trimmed = term.trim();
    if (!trimmed) {
      return of([]);
    }

    const url = `${environment.apiBaseUrl}/stocks/autocomplete/${encodeURIComponent(trimmed)}`;
    return this.withCache(`autocomplete:${trimmed.toUpperCase()}`, () =>
      this.http.get<StockAutocompleteItem[]>(url).pipe(catchError(() => of([]))),
    );
  }

  getStockBasicInfo(search: string): Observable<StockAutocompleteItem | null> {
    const url = `${environment.apiBaseUrl}/getstock-basicinfo/${encodeURIComponent(search)}`;
    return this.withCache(`basic-info:${search.toUpperCase()}`, () =>
      this.http.get<StockAutocompleteItem>(url).pipe(catchError(() => of(null))),
    );
  }

  getInternalStockPrices(userId: string): Observable<InternalStockPriceItem[]> {
    const url = `${environment.apiBaseUrl}/stock-prices/${encodeURIComponent(userId)}`;
    return this.withCache(`internal-prices:${userId}`, () =>
      this.http.get<InternalStockPriceItem[]>(url).pipe(catchError(() => of([]))),
    );
  }

  getInternalDividendYield(userId: string): Observable<InternalDividendYieldResponse> {
    const url = `${environment.apiBaseUrl}/dividend-yield/${encodeURIComponent(userId)}`;
    return this.withCache(`internal-dividend:${userId}`, () =>
      this.http.get<InternalDividendYieldResponse>(url).pipe(catchError(() => of({}))),
    );
  }

  getInternalHistoricalIndicators(userId: string): Observable<InternalHistoricalIndicatorsResponse> {
    const url = `${environment.apiBaseUrl}/historical-indicators/${encodeURIComponent(userId)}`;
    return this.withCache(`internal-indicators:${userId}`, () =>
      this.http.get<InternalHistoricalIndicatorsResponse>(url).pipe(catchError(() => of({}))),
    );
  }

  getBrapiQuote(ticker: string): Observable<{
    price?: number;
    logoUrl?: string;
    changePercent?: number;
    error?: string;
  }> {
    const tokenPart = environment.brapiToken ? `?token=${encodeURIComponent(environment.brapiToken)}` : '';
    const url = `${environment.brapiBaseUrl}/quote/${encodeURIComponent(ticker)}${tokenPart}`;

    return this.withCache(`brapi:${ticker}`, () =>
      this.http.get<BrapiQuoteResponse>(url).pipe(
        map((response) => {
          const first = response.results?.[0];
          if (!first || first.regularMarketPrice === undefined) {
            return { error: 'Cotacao indisponivel' };
          }
          return {
            price: first.regularMarketPrice,
            logoUrl: first.logoUrl || first.logourl,
            changePercent: first.regularMarketChangePercent,
          };
        }),
        catchError(() => of({ error: 'Falha ao consultar BRAPI' })),
      ),
    );
  }

  getInvestidorDividends(ticker: string): Observable<InternalDividendEntry[]> {
    const url = `${environment.investidorBaseUrl}/dividendos/chart/${encodeURIComponent(ticker)}/3650/ano/`;
    return this.withCache(`investidor-dividends:${ticker}`, () =>
      this.http.get<InternalDividendEntry[]>(url).pipe(catchError(() => of([]))),
    );
  }

  getInvestidorIndicators(investidorIdOrTicker: string): Observable<InvestidorIndicatorsEntry[]> {
    const url = `${environment.investidorBaseUrl}/historico-indicadores/${encodeURIComponent(investidorIdOrTicker)}/1`;
    return this.withCache(`investidor-indicators:${investidorIdOrTicker}`, () =>
      this.http.get<InvestidorIndicatorsEntry[]>(url).pipe(catchError(() => of([]))),
    );
  }

  saveHistoricalData(items: SaveHistoricalDataPayloadItem[]): Observable<boolean> {
    const url = `${environment.apiBaseUrl}/savehistoricaldata`;
    return this.http.post(url, items).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  private withCache<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const now = Date.now();
    const cached = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    if (cached && cached.expiresAt > now) {
      return cached.stream$;
    }

    const stream$ = factory().pipe(
      timeout(10_000),
      retry({ count: 1 }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );

    this.memoryCache.set(key, {
      expiresAt: now + environment.cacheTtlMs,
      stream$,
    });

    return stream$;
  }
}
