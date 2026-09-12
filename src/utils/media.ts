export interface MediaValidation {
  playable: boolean;
  type?: 'hls' | 'dash' | 'progressive';
  mimeType?: string | null;
  error?: string;
}