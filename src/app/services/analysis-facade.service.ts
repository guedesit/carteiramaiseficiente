import { Injectable } from '@angular/core';
import { Observable, combineLatest, forkJoin, map, of, switchMap, catchError, startWith } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AnalysisResult,
  AnalysisViewMode,
  ChartDatum,
  StockAnalysisRow,
  StockStatus,
} from '../models/analysis.models';
import { InternalDividendEntry, StockAutocompleteItem } from '../models/api.models';
import { StockApiService } from './stock-api.service';
import { ValuationService } from './valuation.service';

@Injectable({ providedIn: 'root' })
export class AnalysisFacadeService {
  constructor(
    private readonly stockApi: StockApiService,
    private readonly valuation: ValuationService,
  ) {}

  buildAnalysis(
    tickers$: Observable<string[]>,
    desiredReturn$: Observable<number>,
    viewMode$: Observable<AnalysisViewMode>,
  ): Observable<AnalysisResult> {
    return combineLatest([tickers$, desiredReturn$, viewMode$]).pipe(
      switchMap(([tickers, desiredReturn, viewMode]) => {
        if (!tickers.length) {
          return of(this.toResult([], viewMode));
        }

        if (environment.apiMode === 'internal') {
          return this.analyzeWithInternalApi(tickers, desiredReturn, viewMode);
        }

        return this.analyzeWithExternalApi(tickers, desiredReturn, viewMode);
      }),
      startWith(this.toResult([], 'graham')),
    );
  }

  createChart(rows: StockAnalysisRow[], viewMode: AnalysisViewMode): ChartDatum[] {
    return rows
      .filter((row) => row.currentPrice !== undefined)
      .map((row) => {
        const targetPrice = viewMode === 'graham' ? row.grahamPrice : row.bazinPrice;
        return {
          ticker: row.ticker,
          currentPrice: row.currentPrice as number,
          targetPrice: targetPrice ?? row.currentPrice ?? 0,
        };
      })
      .slice(0, 12);
  }

  private analyzeWithInternalApi(
    tickers: string[],
    desiredReturn: number,
    viewMode: AnalysisViewMode,
  ): Observable<AnalysisResult> {
    return forkJoin({
      prices: this.stockApi.getInternalStockPrices(environment.userId),
      dividends: this.stockApi.getInternalDividendYield(environment.userId),
      indicators: this.stockApi.getInternalHistoricalIndicators(environment.userId),
    }).pipe(
      map(({ prices, dividends, indicators }) => {
        const rows = tickers.map((ticker) => {
          const quoteItem = prices.find((item) => item.stock?.toUpperCase() === ticker);
          const dividendItems = dividends[ticker] ?? [];
          const indicator = indicators[ticker];

          return this.composeRow({
            ticker,
            desiredReturn,
            currentPrice: quoteItem?.regularMarketPrice,
            logoUrl: quoteItem?.logoUrl,
            quoteError: quoteItem?.error,
            dividendItems,
            vpa: indicator?.VPA,
            lpa: indicator?.LPA,
          }, viewMode);
        });

        return this.toResult(rows, viewMode);
      }),
      catchError(() => of(this.toResult(this.toFailedRows(tickers), viewMode))),
    );
  }

  private analyzeWithExternalApi(
    tickers: string[],
    desiredReturn: number,
    viewMode: AnalysisViewMode,
  ): Observable<AnalysisResult> {
    const rows$ = tickers.map((ticker) =>
      this.stockApi.searchStocks(ticker).pipe(
        switchMap((autocomplete) => {
          const stockMatch = this.pickTicker(autocomplete, ticker);
          const indicatorReference = String(stockMatch?.id_investidor10 ?? stockMatch?.id ?? ticker);

          return forkJoin({
            quote: this.stockApi.getBrapiQuote(ticker),
            dividends: this.stockApi.getInvestidorDividends(ticker),
            indicators: this.stockApi.getInvestidorIndicators(indicatorReference),
            basicInfo: this.stockApi.getStockBasicInfo(ticker),
          }).pipe(
            map(({ quote, dividends, indicators, basicInfo }) => {
              const latestIndicators = this.pickCurrentIndicators(indicators);
              return this.composeRow({
                ticker,
                desiredReturn,
                currentPrice: quote.price,
                quoteError: quote.error,
                logoUrl: quote.logoUrl || basicInfo?.logo_url || basicInfo?.logoUrl,
                quoteChangePercent: quote.changePercent,
                dividendItems: dividends,
                vpa: latestIndicators?.VPA,
                lpa: latestIndicators?.LPA,
              }, viewMode);
            }),
            catchError(() => of(this.failedRow(ticker))),
          );
        }),
      ),
    );

    return forkJoin(rows$).pipe(
      map((rows) => this.toResult(rows, viewMode)),
      catchError(() => of(this.toResult(this.toFailedRows(tickers), viewMode))),
    );
  }

  private composeRow(
    input: {
      ticker: string;
      desiredReturn: number;
      currentPrice?: number;
      logoUrl?: string;
      quoteError?: string;
      quoteChangePercent?: number;
      dividendItems: InternalDividendEntry[];
      vpa?: number;
      lpa?: number;
    },
    viewMode: AnalysisViewMode,
  ): StockAnalysisRow {
    const dividendPrices = input.dividendItems.map((item) => item.price);
    const grahamPrice = this.valuation.calculateGrahamPrice(input.vpa, input.lpa);
    const bazinPrice = this.valuation.calculateBazinPrice(dividendPrices, input.desiredReturn);
    const grahamPotential = this.valuation.calculateGrahamPotential(input.currentPrice, grahamPrice);
    const bazinMargin = this.valuation.calculateBazinMargin(input.currentPrice, bazinPrice);

    const errors: string[] = [];
    if (input.currentPrice === undefined || input.quoteError) {
      errors.push(input.quoteError ?? 'Erro de cotacao');
    }
    if (grahamPrice === undefined) {
      errors.push('Graham indisponivel (VPA/LPA ausente)');
    }
    if (bazinPrice === undefined) {
      errors.push('Bazin indisponivel (dividendos ausentes)');
    }

    const status = this.resolveStatus(
      input.currentPrice,
      viewMode === 'graham' ? grahamPrice : bazinPrice,
      errors.length > 0 && input.currentPrice === undefined,
    );

    return {
      ticker: input.ticker,
      logoUrl: input.logoUrl,
      quoteError: input.quoteError,
      quoteChangePercent: input.quoteChangePercent,
      currentPrice: input.currentPrice,
      grahamPrice,
      bazinPrice,
      grahamPotential,
      bazinMargin,
      status,
      confidenceLow: this.valuation.hasLowDividendConfidence(dividendPrices),
      errors,
    };
  }

  private resolveStatus(currentPrice?: number, targetPrice?: number, quoteError?: boolean): StockStatus {
    if (quoteError || currentPrice === undefined) {
      return 'quote-error';
    }
    if (targetPrice !== undefined && currentPrice > targetPrice) {
      return 'quarantine';
    }
    return 'eligible';
  }

  private toResult(rows: StockAnalysisRow[], viewMode: AnalysisViewMode): AnalysisResult {
    const mainRows = rows.filter((row) => row.status === 'eligible');
    const quarantineRows = rows.filter((row) => row.status === 'quarantine' || row.status === 'quote-error');

    return {
      generatedAt: new Date().toISOString(),
      viewMode,
      rows,
      mainRows,
      quarantineRows,
    };
  }

  private toFailedRows(tickers: string[]): StockAnalysisRow[] {
    return tickers.map((ticker) => this.failedRow(ticker));
  }

  private failedRow(ticker: string): StockAnalysisRow {
    return {
      ticker,
      status: 'quote-error',
      confidenceLow: true,
      errors: ['Falha ao carregar dados da acao'],
    };
  }

  private pickCurrentIndicators(items: Array<{ year?: string | number; VPA?: number; LPA?: number }>): {
    VPA?: number;
    LPA?: number;
  } | null {
    if (!items.length) {
      return null;
    }
    const currentYear = new Date().getFullYear();
    const exact = items.find((item) => Number(item.year) === currentYear);
    return exact ?? items[0] ?? null;
  }

  private pickTicker(items: StockAutocompleteItem[], ticker: string): StockAutocompleteItem | undefined {
    const upper = ticker.toUpperCase();
    return items.find((item) => item.codigo?.toUpperCase() === upper) ?? items[0];
  }
}
