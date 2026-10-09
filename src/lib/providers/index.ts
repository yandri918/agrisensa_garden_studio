/**
 * AgriSensa Garden Studio — Provider Abstraction Layer
 * ===================================================
 * Menyediakan 2 variabel antarmuka utama:
 *  1. `searchProvider`: SearchProvider (Orchestrator Tavily -> Exa -> Native)
 *  2. `scraperProvider`: ScraperProvider (Orchestrator Tavily -> Exa -> BrightData -> Native)
 *
 * Seluruh penyedia berjalan murni di backend (server-side) tanpa terekspos di antarmuka pengguna (UI).
 */

import type {
  SearchProvider,
  ScraperProvider,
  SearchOptions,
  SearchResponse,
  ScrapeOptions,
  ScrapedContent,
} from './types';

import { TavilySearchProvider, TavilyScraperProvider } from './tavily';
import { ExaSearchProvider, ExaScraperProvider } from './exa';
import { BrightDataScraperProvider } from './brightdata';
import { NativeSearchProvider, NativeScraperProvider } from './native';

export * from './types';
export * from './tavily';
export * from './exa';
export * from './brightdata';
export * from './native';

/**
 * Composite Search Provider dengan Automatic Failover
 */
export class CompositeSearchProvider implements SearchProvider {
  public readonly name = 'composite_search';
  private readonly providers: SearchProvider[];

  constructor(providers?: SearchProvider[]) {
    this.providers = providers ?? [
      new TavilySearchProvider(),
      new ExaSearchProvider(),
      new NativeSearchProvider(),
    ];
  }

  public isAvailable(): boolean {
    return this.providers.some((p) => p.isAvailable());
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const activeProviders = this.providers.filter((p) => p.isAvailable());
    if (activeProviders.length === 0) {
      throw new Error('No search provider available');
    }

    const errors: string[] = [];
    for (const provider of activeProviders) {
      try {
        const result = await provider.search(query, options);
        if (result && result.results.length > 0) {
          return result;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[${provider.name}]: ${msg}`);
      }
    }

    // Jika seluruh provider utama mengembalikan hasil kosong tapi tidak crash, return yang pertama berhasil
    return {
      query,
      results: [],
      provider: 'none',
      elapsedMs: 0,
    };
  }
}

/**
 * Composite Scraper Provider dengan Automatic Failover
 */
export class CompositeScraperProvider implements ScraperProvider {
  public readonly name = 'composite_scraper';
  private readonly providers: ScraperProvider[];

  constructor(providers?: ScraperProvider[]) {
    this.providers = providers ?? [
      new TavilyScraperProvider(),
      new ExaScraperProvider(),
      new BrightDataScraperProvider(),
      new NativeScraperProvider(),
    ];
  }

  public isAvailable(): boolean {
    return this.providers.some((p) => p.isAvailable());
  }

  public async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedContent> {
    const activeProviders = this.providers.filter((p) => p.isAvailable());
    if (activeProviders.length === 0) {
      throw new Error('No scraper provider available');
    }

    const errors: string[] = [];
    for (const provider of activeProviders) {
      try {
        const result = await provider.scrape(url, options);
        if (result && (result.markdown.trim().length > 30 || result.text.trim().length > 30)) {
          return result;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[${provider.name}]: ${msg}`);
      }
    }

    throw new Error(`All scraper providers failed for ${url}. Errors: ${errors.join('; ')}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 VARIABEL ANTARMUKA UTAMA (Search Provider & Scraper Provider)
// ─────────────────────────────────────────────────────────────────────────────

export const searchProvider: SearchProvider = new CompositeSearchProvider();
export const scraperProvider: ScraperProvider = new CompositeScraperProvider();
