export type ProviderRecord = Record<string, unknown>;

export interface ProviderResponse extends ProviderRecord {
  status?: string;
  creator?: string;
  source?: string;
}

export interface NormalizedAnime {
  title: string | null;
  slug: string | null;
  poster: string | null;
  type: string | null;
  episode: string | null;
  status: string | null;
  synopsis?: string | null;
  info?: ProviderRecord | null;
  genres?: ProviderRecord[];
  episodes?: ProviderRecord[];
  provider: { source: string | null; url: string | null };
  providerData: ProviderRecord;
}

export interface NormalizedEpisode {
  title: string | null;
  slug: string;
  number: string | null;
  releaseDate: string | null;
  url: string | null;
  providerData: ProviderRecord;
}

export interface NormalizedStream {
  name: string | null;
  url: string | null;
  server: string | null;
  serverId: string | null;
  quality: string | null;
  resolution: string | null;
  format: string | null;
  mimeType: string | null;
  subtitle: string | null;
  audio: string | null;
  type: string | null;
  providerData: ProviderRecord;
}

export interface NormalizedDownload {
  name: string | null;
  url: string | null;
  resolution: string | null;
  format: string | null;
  providerData: ProviderRecord;
}
