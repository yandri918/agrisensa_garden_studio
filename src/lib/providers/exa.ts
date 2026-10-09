import type {
  SearchProvider,
  ScraperProvider,
  SearchOptions,
  SearchResponse,
  SearchResultItem,
  ScrapeOptions,
  ScrapedContent,
} from './types';

export class ExaSearchProvider implements SearchProvider {
  public readonly name = 'exa';

  private getApiKey(): string | undefined {
    return process.env.EXA_API_KEY;
  }

  public isAvailable(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('EXA_API_KEY is not configured');
    }

    const t0 = performance.now();
    const timeoutMs = options?.timeoutMs ?? 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          query,
          numResults: options?.maxResults ?? 5,
          useAutoprompt: true,
          contents: {
            text: true,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Exa search failed [${res.status}]: ${errorText.slice(0, 150)}`);
      }

      const json = await res.json();
      const results: SearchResultItem[] = Array.isArray(json?.results)
        ? json.results.map((r: { title?: string; url?: string; text?: string; score?: number; publishedDate?: string }) => ({
            title: r.title || 'Untitled',
            url: r.url || '',
            content: r.text || '',
            score: r.score,
            publishedDate: r.publishedDate,
            source: r.url ? new URL(r.url).hostname : undefined,
          }))
        : [];

      return {
        query,
        results,
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export class ExaScraperProvider implements ScraperProvider {
  public readonly name = 'exa';

  private getApiKey(): string | undefined {
    return process.env.EXA_API_KEY;
  }

  public isAvailable(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  public async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedContent> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('EXA_API_KEY is not configured');
    }

    const t0 = performance.now();
    const timeoutMs = options?.timeoutMs ?? 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          urls: [url],
          text: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Exa contents failed [${res.status}]: ${errorText.slice(0, 150)}`);
      }

      const json = await res.json();
      const first = Array.isArray(json?.results) ? json.results[0] : null;
      const text = first?.text || '';

      return {
        url,
        title: first?.title,
        markdown: text,
        text,
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
