export interface InterestListState {
  tickers: string[];
  desiredReturn: number;
  updatedAt: string;
}

export type AnalysisViewMode = 'graham' | 'bazin';
export type StockStatus = 'eligible' | 'quarantine' | 'quote-error';

export interface StockAnalysisRow {
  ticker: string;
  logoUrl?: string;
  quoteError?: string;
  quoteChangePercent?: number;
  currentPrice?: number;
  grahamPrice?: number;
  bazinPrice?: number;
  grahamPotential?: number;
  bazinMargin?: number;
  status: StockStatus;
  confidenceLow: boolean;
  errors: string[];
}

export interface AnalysisResult {
  generatedAt: string;
  viewMode: AnalysisViewMode;
  rows: StockAnalysisRow[];
  mainRows: StockAnalysisRow[];
  quarantineRows: StockAnalysisRow[];
}

export interface ChartDatum {
  ticker: string;
  currentPrice: number;
  targetPrice: number;
}
