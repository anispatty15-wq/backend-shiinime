import { describe, expect, it } from 'vitest';
import type { AxiosInstance } from 'axios';
import { OploverzService } from '../src/services/OploverzService.js';

function clientFor(counter: { calls: number }, delayMs = 0): AxiosInstance {
  return {
    get: async () => {
      counter.calls += 1;
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      return { status: 200, data: { status: 'success', anime_list: [] } };
    }
  } as unknown as AxiosInstance;
}

describe('OploverzService cache and request deduplication', () => {
  it('caches repeated home requests within the TTL', async () => {
    const counter = { calls: 0 };
    const service = new OploverzService(clientFor(counter));

    await service.getHome();
    await service.getHome();

    expect(counter.calls).toBe(1);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const counter = { calls: 0 };
    const service = new OploverzService(clientFor(counter, 20));

    await Promise.all([service.getHome(), service.getHome(), service.getHome()]);

    expect(counter.calls).toBe(1);
  });
});
