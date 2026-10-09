/**
 * AgriSensa Garden Studio — Provider Abstraction Layer Types
 * Strictly decoupled backend interfaces for Web Scraping and Search.
 * No provider brand or vendor details are exposed to the UI layer.
 */

export interface SearchResultItem {
  title: string;
  url: string;
  content: string; // snippet or extracted summary
  score?: number;
  publishedDate?: string;
  source?: string;
}

export interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  timeoutMs?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  answer?: string;
  provider: string; // e.g. 'tavily' | 'exa' | 'native'
  elapsedMs: number;
}

/**
 * Interface Search Provider
 */
export interface SearchProvider {
  readonly name: string;
  isAvailable(): boolean;
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
}

export interface ScrapedContent {
  url: string;
  title?: string;
  markdown: string;
  text: string;
  metadata?: Record<string, unknown>;
  provider: string; // e.g. 'tavily' | 'exa' | 'brightdata' | 'native'
  elapsedMs: number;
}

export interface ScrapeOptions {
  formats?: ('markdown' | 'text' | 'html')[];
  timeoutMs?: number;
}

/**
 * Interface Scraper Provider
 */
export interface ScraperProvider {
  readonly name: string;
  isAvailable(): boolean;
  scrape(url: string, options?: ScrapeOptions): Promise<ScrapedContent>;
}
