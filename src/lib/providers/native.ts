import type {
  SearchProvider,
  ScraperProvider,
  SearchOptions,
  SearchResponse,
  SearchResultItem,
  ScrapeOptions,
  ScrapedContent,
} from './types';

export class NativeScraperProvider implements ScraperProvider {
  public readonly name = 'native';

  public isAvailable(): boolean {
    return true;
  }

  public async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedContent> {
    const t0 = performance.now();
    const timeoutMs = options?.timeoutMs ?? 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Native fetch failed with HTTP ${res.status}`);
      }

      const html = await res.text();
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;

      // Clean HTML to clean text
      const clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

      return {
        url,
        title,
        markdown: clean,
        text: clean,
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export class NativeSearchProvider implements SearchProvider {
  public readonly name = 'native';

  public isAvailable(): boolean {
    return true;
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const t0 = performance.now();
    const timeoutMs = options?.timeoutMs ?? 6000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // DuckDuckGo HTML Lite search as zero-config fallback
      const encoded = encodeURIComponent(query);
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      });

      const results: SearchResultItem[] = [];

      if (res.ok) {
        const html = await res.text();
        const snippetRegex = /<a class="result__url" href="([^"]+)">[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
        let match: RegExpExecArray | null;
        let count = 0;
        const max = options?.maxResults ?? 5;

        while ((match = snippetRegex.exec(html)) !== null && count < max) {
          const rawUrl = match[1].trim();
          const cleanSnippet = match[2].replace(/<[^>]+>/g, '').trim();
          results.push({
            title: `Hasil Pencarian Agrikultur ${count + 1}`,
            url: rawUrl,
            content: cleanSnippet,
            source: 'web',
          });
          count++;
        }
      }

      return {
        query,
        results,
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } catch {
      // Even if public DuckDuckGo blocks or times out, return empty list gracefully
      return {
        query,
        results: [],
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
