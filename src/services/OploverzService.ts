import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env.js';
import { ProviderResponse } from '../types/provider.js';
import { providerError } from '../utils/errors.js';

export class OploverzService {
  private readonly client: AxiosInstance;
  private readonly cache = new Map<string, { expiresAt: number; value: ProviderResponse }>();
  private readonly pending = new Map<string, Promise<ProviderResponse>>();

  constructor(client?: AxiosInstance) {
    this.client = client ?? axios.create({
      baseURL: `${env.OPLOVERZ_BASE_URL.replace(/\/$/, '')}/anime/oploverz`,
      timeout: env.PROVIDER_TIMEOUT_MS,
      validateStatus: () => true
    });
  }

  private ttlFor(path: string) {
    if (path === '/home') return env.CACHE_HOME_TTL_MS;
    if (path === '/schedule') return env.CACHE_SCHEDULE_TTL_MS;
    if (path === '/ongoing' || path === '/completed' || path === '/list') return env.CACHE_COLLECTION_TTL_MS;
    if (path.startsWith('/search/')) return env.CACHE_SEARCH_TTL_MS;
    if (path.startsWith('/anime/')) return env.CACHE_DETAIL_TTL_MS;
    if (path.startsWith('/episode/')) return env.CACHE_EPISODE_TTL_MS;
    return 0;
  }

  private cacheKey(path: string, params?: Record<string, string | number | undefined>) {
    const query = Object.entries(params ?? {}).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b));
    return query.length === 0 ? path : `${path}?${new URLSearchParams(query.map(([key, value]) => [key, String(value)]))}`;
  }

  private setCache(key: string, value: ProviderResponse, ttl: number) {
    const now = Date.now();
    for (const [entryKey, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(entryKey);
    }
    while (this.cache.size >= env.CACHE_MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt: now + ttl });
  }

  private async fetch(path: string, params?: Record<string, string | number | undefined>): Promise<ProviderResponse> {
    try {
      const response = await this.client.get<ProviderResponse>(path, { params });
      if (response.status >= 400) throw providerError(`Provider returned HTTP ${response.status}`);
      if (!response.data || typeof response.data !== 'object') throw providerError('Provider returned invalid JSON');
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') throw error;
      if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
        throw providerError('Provider request timed out', 504);
      }
      throw providerError(error instanceof Error ? error.message : 'Provider request failed');
    }
  }

  private async get(path: string, params?: Record<string, string | number | undefined>): Promise<ProviderResponse> {
    const key = this.cacheKey(path, params);
    const ttl = this.ttlFor(path);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (cached) this.cache.delete(key);

    const running = this.pending.get(key);
    if (running) return running;

    const request = this.fetch(path, params).then((value) => {
      if (ttl > 0) this.setCache(key, value, ttl);
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }

  getHome() { return this.get('/home'); }
  getSchedule() { return this.get('/schedule'); }
  getOngoing(page?: number) { return this.get('/ongoing', { page }); }
  getCompleted(page?: number) { return this.get('/completed', { page }); }
  getList(page?: number) { return this.get('/list', { page }); }
  searchAnime(query: string, page?: number) { return this.get(`/search/${encodeURIComponent(query)}`, { page }); }
  getAnimeDetail(slug: string) { return this.get(`/anime/${encodeURIComponent(slug)}`); }
  getEpisode(slug: string) { return this.get(`/episode/${encodeURIComponent(slug)}`); }
}
