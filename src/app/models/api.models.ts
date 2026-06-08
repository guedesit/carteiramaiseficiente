export type ApiMode = 'internal' | 'external';

export interface StockAutocompleteItem {
  id?: number | string;
  codigo: string;
  nome?: string;
  logo_url?: string;
  logoUrl?: string;
  id_investidor10?: number | string;
}

export interface InternalStockPriceItem {
  stock: string;
  logoUrl?: string;
  regularMarketPrice?: number;
  error?: string;
}

export interface InternalDividendEntry {
  created_at: string;
  price: number;
}

export interface InternalHistoricalIndicatorsByTicker {
  VPA?: number;
  LPA?: number;
}

export type InternalDividendYieldResponse = Record<string, InternalDividendEntry[]>;
export type InternalHistoricalIndicatorsResponse = Record<string, InternalHistoricalIndicatorsByTicker>;

export interface BrapiQuoteResponse {
  results?: Array<{
    symbol?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
    logoUrl?: string;
    logourl?: string;
  }>;
}

export interface InvestidorDividendEntry {
  created_at: string;
  price: number;
}

export interface InvestidorIndicatorsEntry {
  year?: string | number;
  VPA?: number;
  LPA?: number;
}

export interface SaveHistoricalDataPayloadItem {
  user_id: string | number;
  stock_id: string;
  date: string;
  preco_justo: number;
  preco_atual: number;
  potencial_valorizacao: number;
}
