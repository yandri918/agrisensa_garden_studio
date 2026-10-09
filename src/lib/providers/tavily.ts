import type {
  SearchProvider,
  ScraperProvider,
  SearchOptions,
  SearchResponse,
  SearchResultItem,
  ScrapeOptions,
  ScrapedContent,
} from './types';

export class TavilySearchProvider implements SearchProvider {
  public readonly name = 'tavily';

  private getApiKey(): string | undefined {
    return process.env.TAVILY_API_KEY;
  }

  public isAvailable(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    const t0 = performance.now();
    const timeoutMs = options?.timeoutMs ?? 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: options?.maxResults ?? 5,
          search_depth: options?.searchDepth ?? 'basic',
          include_answer: options?.includeAnswer ?? true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Tavily search failed [${res.status}]: ${errorText.slice(0, 150)}`);
      }

      const json = await res.json();
      const results: SearchResultItem[] = Array.isArray(json?.results)
        ? json.results.map((r: { title?: string; url?: string; content?: string; score?: number; published_date?: string }) => ({
            title: r.title || 'Untitled',
            url: r.url || '',
            content: r.content || '',
            score: r.score,
            publishedDate: r.published_date,
            source: r.url ? new URL(r.url).hostname : undefined,
          }))
        : [];

      return {
        query,
        results,
        answer: json.answer || undefined,
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export class TavilyScraperProvider implements ScraperProvider {
  public readonly name = 'tavily';

  private getApiKey(): string | undefined {
    return process.env.TAVILY_API_KEY;
  }

  public isAvailable(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  public async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedContent> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    const t0 = performance.now();
    const timeoutMs = options?.timeoutMs ?? 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          urls: [url],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Tavily extract failed [${res.status}]: ${errorText.slice(0, 150)}`);
      }

      const json = await res.json();
      const first = Array.isArray(json?.results) ? json.results[0] : null;
      const rawContent = first?.raw_content || '';

      return {
        url,
        title: first?.title,
        markdown: rawContent,
        text: rawContent,
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
