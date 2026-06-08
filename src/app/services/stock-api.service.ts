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
import { ApiAccessLogService } from './api-access-log.service';
import { environment } from '../../environments/environment';

interface CacheEntry<T> {
  expiresAt: number;
  stream$: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private readonly memoryCache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly http: HttpClient,
    private readonly apiAccessLog: ApiAccessLogService,
  ) {}

  searchStocks(term: string): Observable<StockAutocompleteItem[]> {
    const trimmed = term.trim();
    if (!trimmed) {
      return of([]);
    }

    const url = `${environment.apiBaseUrl}/stocks/autocomplete/${encodeURIComponent(trimmed)}`;
    return this.withCache(`autocomplete:${trimmed.toUpperCase()}`, () =>
      this.http
        .get<StockAutocompleteItem[]>(url)
        .pipe(catchError((error) => this.toFallback(url, 'Autocomplete', error, []))),
    );
  }

  getStockBasicInfo(search: string): Observable<StockAutocompleteItem | null> {
    const url = `${environment.apiBaseUrl}/getstock-basicinfo/${encodeURIComponent(search)}`;
    return this.withCache(`basic-info:${search.toUpperCase()}`, () =>
      this.http
        .get<StockAutocompleteItem>(url)
        .pipe(catchError((error) => this.toFallback(url, 'Basic Info', error, null))),
    );
  }

  getInternalStockPrices(userId: string): Observable<InternalStockPriceItem[]> {
    const url = `${environment.apiBaseUrl}/stock-prices/${encodeURIComponent(userId)}`;
    return this.withCache(`internal-prices:${userId}`, () =>
      this.http
        .get<InternalStockPriceItem[]>(url)
        .pipe(catchError((error) => this.toFallback(url, 'Internal Prices', error, []))),
    );
  }

  getInternalDividendYield(userId: string): Observable<InternalDividendYieldResponse> {
    const url = `${environment.apiBaseUrl}/dividend-yield/${encodeURIComponent(userId)}`;
    return this.withCache(`internal-dividend:${userId}`, () =>
      this.http
        .get<InternalDividendYieldResponse>(url)
        .pipe(catchError((error) => this.toFallback(url, 'Internal Dividends', error, {}))),
    );
  }

  getInternalHistoricalIndicators(userId: string): Observable<InternalHistoricalIndicatorsResponse> {
    const url = `${environment.apiBaseUrl}/historical-indicators/${encodeURIComponent(userId)}`;
    return this.withCache(`internal-indicators:${userId}`, () =>
      this.http
        .get<InternalHistoricalIndicatorsResponse>(url)
        .pipe(catchError((error) => this.toFallback(url, 'Internal Indicators', error, {}))),
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
            this.apiAccessLog.add({
              api: 'BRAPI Quote',
              url,
              message: 'Resposta sem cotacao valida',
            });
            return { error: 'Cotacao indisponivel' };
          }
          return {
            price: first.regularMarketPrice,
            logoUrl: first.logoUrl || first.logourl,
            changePercent: first.regularMarketChangePercent,
          };
        }),
        catchError((error) => this.toFallback(url, 'BRAPI Quote', error, { error: 'Falha ao consultar BRAPI' })),
      ),
    );
  }

  getInvestidorDividends(ticker: string): Observable<InternalDividendEntry[]> {
    const url = `${environment.investidorBaseUrl}/dividendos/chart/${encodeURIComponent(ticker)}/3650/ano/`;
    return this.withCache(`investidor-dividends:${ticker}`, () =>
      this.http
        .get<InternalDividendEntry[]>(url)
        .pipe(catchError((error) => this.toFallback(url, 'Investidor Dividends', error, []))),
    );
  }

  getInvestidorIndicators(investidorIdOrTicker: string): Observable<InvestidorIndicatorsEntry[]> {
    const url = `${environment.investidorBaseUrl}/historico-indicadores/${encodeURIComponent(investidorIdOrTicker)}/1`;
    return this.withCache(`investidor-indicators:${investidorIdOrTicker}`, () =>
      this.http
        .get<InvestidorIndicatorsEntry[]>(url)
        .pipe(catchError((error) => this.toFallback(url, 'Investidor Indicators', error, []))),
    );
  }

  saveHistoricalData(items: SaveHistoricalDataPayloadItem[]): Observable<boolean> {
    const url = `${environment.apiBaseUrl}/savehistoricaldata`;
    return this.http.post(url, items).pipe(
      map(() => true),
      catchError((error) => this.toFallback(url, 'Save Historical Data', error, false)),
    );
  }

  private toFallback<T>(url: string, api: string, error: unknown, fallback: T): Observable<T> {
    this.apiAccessLog.add({
      api,
      url,
      message: this.extractMessage(error),
      status: this.extractStatus(error),
    });
    return of(fallback);
  }

  private extractStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: unknown }).status;
      if (typeof status === 'number') {
        return status;
      }
    }
    return undefined;
  }

  private extractMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
        return (error as { message: string }).message;
      }
      if ('statusText' in error && typeof (error as { statusText?: unknown }).statusText === 'string') {
        return (error as { statusText: string }).statusText;
      }
    }
    return 'Falha ao acessar API';
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
