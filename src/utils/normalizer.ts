import { NormalizedAnime, NormalizedDownload, NormalizedEpisode, NormalizedStream, ProviderRecord, ProviderResponse } from '../types/provider.js';

const record = (value: unknown): ProviderRecord => value && typeof value === 'object' ? value as ProviderRecord : {};
const text = (value: unknown): string | null => typeof value === 'string' ? value : value == null ? null : String(value);

export function normalizeAnime(item: unknown): NormalizedAnime {
  const source = record(item);
  const providerUrl = text(source.oploverz_url ?? source.url);
  const slug = text(source.slug) === 'anime' && providerUrl ? providerUrl.split('/').filter(Boolean).at(-1) ?? null : text(source.slug);
  return {
    title: text(source.title), slug, poster: text(source.poster), type: text(source.type), episode: text(source.episode),
    status: text(source.status), synopsis: text(source.synopsis), info: source.info ? record(source.info) : null,
    genres: Array.isArray(source.genres) ? source.genres.map(record) : [],
    episodes: Array.isArray(source.episode_list) ? source.episode_list.map(record) : [],
    provider: { source: text(source.source), url: providerUrl }, providerData: source
  };
}

export function normalizeCollection(response: ProviderResponse) {
  const source = record(response);
  const list = Array.isArray(source.anime_list) ? source.anime_list : [];
  return { items: list.map(normalizeAnime), schedule: source.schedule ?? null, pagination: source.pagination ?? null, providerData: source };
}

export function normalizeDetail(response: ProviderResponse) {
  const source = record(response);
  const detail = source.detail ? normalizeAnime({ ...record(source.detail), source: source.source }) : null;
  return { anime: detail, providerData: source };
}

export function normalizeEpisode(item: unknown): NormalizedEpisode {
  const source = record(item);
  return { title: text(source.title), slug: text(source.slug) ?? '', number: text(source.episode), releaseDate: text(source.release_date), url: text(source.url), providerData: source };
}

export function normalizeStream(item: unknown): NormalizedStream {
  const source = record(item);
  return {
    name: text(source.name), url: text(source.url), server: text(source.server), serverId: text(source.server_id ?? source.serverId),
    quality: text(source.quality), resolution: text(source.resolution), format: text(source.format), mimeType: text(source.mime_type ?? source.mimeType),
    subtitle: text(source.subtitle), audio: text(source.audio), type: text(source.type), providerData: source
  };
}

export function normalizeDownload(item: unknown): NormalizedDownload {
  const source = record(item);
  return { name: text(source.name), url: text(source.url), resolution: text(source.resolution), format: text(source.format), providerData: source };
}

export function normalizeEpisodeResponse(response: ProviderResponse) {
  const source = record(response);
  return {
    episode: normalizeEpisode({ slug: source.slug, title: source.episode_title, episode: source.episode, url: source.url }),
    streams: Array.isArray(source.streams) ? source.streams.map(normalizeStream) : [],
    downloads: Array.isArray(source.downloads) ? source.downloads.map(normalizeDownload) : [],
    providerData: source
  };
}
