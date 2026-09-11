import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env.js';
import { ProviderResponse } from '../types/provider.js';
import { providerError } from '../utils/errors.js';

export class OploverzService {
  private readonly client: AxiosInstance;

  constructor(client?: AxiosInstance) {
    this.client = client ?? axios.create({
      baseURL: `${env.OPLOVERZ_BASE_URL.replace(/\/$/, '')}/anime/oploverz`,
      timeout: env.PROVIDER_TIMEOUT_MS,
      validateStatus: () => true
    });
  }

  private async get(path: string, params?: Record<string, string | number | undefined>): Promise<ProviderResponse> {
    try {
      const response = await this.client.get<ProviderResponse>(path, { params });
      if (response.status >= 400) throw providerError(`Provider returned HTTP ${response.status}`);
      if (!response.data || typeof response.data !== 'object') throw providerError('Provider returned invalid JSON');
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') throw error;
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw providerError('Provider request timed out', 504);
      }
      throw providerError(error instanceof Error ? error.message : 'Provider request failed');
    }
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
