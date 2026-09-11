import { FastifyInstance } from 'fastify';
import { OploverzService } from '../services/OploverzService.js';
import { normalizeCollection, normalizeDetail, normalizeEpisodeResponse } from '../utils/normalizer.js';
import { ok } from '../utils/response.js';
import { querySchema, searchParamsSchema, slugSchema } from '../schemas/common.js';

export function animeRoutes(service = new OploverzService()) {
  return async function registerAnimeRoutes(app: FastifyInstance) {
  const collection = (method: () => ReturnType<OploverzService['getHome']>) => async (request: any, reply: any) => ok(reply, normalizeCollection(await method()));
  app.get('/anime/home', collection(() => service.getHome()));
  app.get('/anime/schedule', collection(() => service.getSchedule()));
  app.get('/anime/ongoing', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getOngoing(query.page)));
  });
  app.get('/anime/completed', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getCompleted(query.page)));
  });
  app.get('/anime/list', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getList(query.page)));
  });
  app.get('/anime/search/:query', async (request, reply) => {
    const params = searchParamsSchema.parse(request.params);
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.searchAnime(params.query, query.page)));
  });
  app.get('/anime/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    return ok(reply, normalizeDetail(await service.getAnimeDetail(params.slug)));
  });
  app.get('/episode/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    return ok(reply, normalizeEpisodeResponse(await service.getEpisode(params.slug)));
  });
  };
}
