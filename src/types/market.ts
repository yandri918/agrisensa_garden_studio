/**
 * AgriSensa Garden Studio — Market Intelligence Types
 * Sourced and parsed via Firecrawl MCP & National Food Price Indexes (Bapanas / PIHPS)
 */

export interface MarketPriceItem {
  cropId: string;
  commodityName: string;
  category: 'sayuran_daun' | 'sayuran_buah' | 'bumbu_rempah';
  currentPriceIdr: number;    // Harga per kg saat ini (IDR)
  baselinePriceIdr: number;   // Harga standar katalog (IDR)
  deltaPct: number;           // Persentase perubahan vs standar (+/- %)
  unit: string;               // 'kg'
  volatility: 'low' | 'medium' | 'high';
  updatedAt: string;
}

export interface MarketPricesResponse {
  success: boolean;
  source: string;
  sourceUrl?: string;
  scrapedVia: 'firecrawl_live' | 'bapanas_benchmark_cache';
  timestamp: string;
  region: string;
  prices: Record<string, MarketPriceItem>;
}
