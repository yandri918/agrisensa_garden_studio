import type {
  ScraperProvider,
  ScrapeOptions,
  ScrapedContent,
} from './types';

export class BrightDataScraperProvider implements ScraperProvider {
  public readonly name = 'brightdata';

  private getApiKey(): string | undefined {
    return process.env.BRIGHTDATA_API_KEY;
  }

  private getZone(): string {
    return process.env.BRIGHTDATA_ZONE || 'web_unlocker1';
  }

  public isAvailable(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  public async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedContent> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('BRIGHTDATA_API_KEY is not configured');
    }

    const t0 = performance.now();
    const timeoutMs = options?.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Using Bright Data Web Unlocker API endpoint
      const res = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          zone: this.getZone(),
          url,
          format: 'raw',
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`BrightData request failed [${res.status}]: ${errorText.slice(0, 150)}`);
      }

      const rawHtml = await res.text();
      // Basic extraction from HTML to clean text
      const cleanText = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        url,
        markdown: cleanText,
        text: cleanText,
        provider: this.name,
        elapsedMs: Math.round(performance.now() - t0),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
