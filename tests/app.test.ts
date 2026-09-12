import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { AppError } from '../src/utils/errors.js';

const provider = {
  getHome: async () => ({ status: 'success', source: 'Oploverz', anime_list: [] }),
  getSchedule: async () => ({ status: 'success', source: 'Oploverz', schedule: {} }),
  getOngoing: async () => ({ status: 'success', source: 'Oploverz', anime_list: [], pagination: {} }),
  getCompleted: async () => ({ status: 'success', source: 'Oploverz', anime_list: [], pagination: {} }),
  getList: async () => ({ status: 'success', source: 'Oploverz', anime_list: [], pagination: {} }),
  searchAnime: async () => ({ status: 'success', source: 'Oploverz', anime_list: [], pagination: {} }),
  getAnimeDetail: async () => ({ status: 'success', source: 'Oploverz', detail: { title: 'One Piece', episode_list: [] } }),
  getEpisode: async () => ({ status: 'success', source: 'Oploverz', episode_title: 'Episode', streams: [], downloads: [] })
};

describe('SHIINIME API', () => {
  const app = buildApp(provider as never);
  beforeAll(() => app.ready());
  afterAll(() => app.close());

  it.each(['/health', '/anime/home', '/anime/schedule', '/anime/ongoing', '/anime/completed', '/anime/list', '/anime/search/one-piece', '/anime/one-piece', '/episode/episode-1'])('serves %s', async (url) => {
    const response = await app.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(200);
    expect(response.json().success).toBe(true);
  });

  it('rejects an invalid slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/anime/not valid' });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns the consistent auth error when Firebase is not configured', async () => {
    const response = await app.inject({ method: 'GET', url: '/profile' });
    expect([401, 503]).toContain(response.statusCode);
    expect(['UNAUTHORIZED', 'FIREBASE_NOT_CONFIGURED']).toContain(response.json().error.code);
  });

  it.each([
    ['GET', '/favorites'], ['POST', '/favorites'], ['DELETE', '/favorites/demo'], ['GET', '/history'],
    ['GET', '/leaderboard'], ['POST', '/watch/start'], ['POST', '/watch/heartbeat'], ['POST', '/watch/complete']
  ])('protects %s %s', async (method, url) => {
    const response = await app.inject({ method: method as 'GET' | 'POST' | 'DELETE', url });
    expect([401, 503]).toContain(response.statusCode);
    expect(['UNAUTHORIZED', 'FIREBASE_NOT_CONFIGURED']).toContain(response.json().error.code);
  });

  it('maps provider failures to provider errors', async () => {
    const failingApp = buildApp({ ...provider, getHome: async () => { throw new AppError('PROVIDER_ERROR', 'Provider request timed out', 504); } } as never);
    const response = await failingApp.inject({ method: 'GET', url: '/anime/home' });
    expect(response.statusCode).toBe(504);
    expect(response.json().error.code).toBe('PROVIDER_ERROR');
    await failingApp.close();
  });
});
