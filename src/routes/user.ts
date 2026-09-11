import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { UserService } from '../services/UserService.js';
import { favoriteBodySchema, watchCompleteSchema, watchHeartbeatSchema, watchStartSchema } from '../schemas/user.js';
import { slugSchema } from '../schemas/common.js';
import { ok } from '../utils/response.js';

export function userRoutes(service = new UserService()) {
  return async function registerUserRoutes(app: FastifyInstance) {
    app.addHook('preHandler', requireAuth);
    app.get('/profile', async (request, reply) => ok(reply, await service.getProfile(request.user!.uid)));
    app.get('/favorites', async (request, reply) => ok(reply, await service.listFavorites(request.user!.uid)));
    app.post('/favorites', async (request, reply) => {
      const body = favoriteBodySchema.parse(request.body);
      return ok(reply, await service.addFavorite(request.user!.uid, body.animeSlug, body.anime), 201);
    });
    app.delete('/favorites/:animeSlug', async (request, reply) => {
      const { slug } = slugSchema.parse({ slug: (request.params as { animeSlug: string }).animeSlug });
      return ok(reply, await service.removeFavorite(request.user!.uid, slug));
    });
    app.get('/history', async (request, reply) => ok(reply, await service.listHistory(request.user!.uid)));
    app.get('/leaderboard', async (_request, reply) => ok(reply, await service.leaderboard()));
    app.post('/watch/start', async (request, reply) => {
      const body = watchStartSchema.parse(request.body);
      return ok(reply, await service.startWatch(request.user!.uid, body.episodeSlug, body.durationSeconds), 201);
    });
    app.post('/watch/heartbeat', async (request, reply) => {
      const body = watchHeartbeatSchema.parse(request.body);
      return ok(reply, await service.heartbeat(request.user!.uid, body.sessionId, body.positionSeconds, body.durationSeconds));
    });
    app.post('/watch/complete', async (request, reply) => {
      const body = watchCompleteSchema.parse(request.body);
      return ok(reply, await service.complete(request.user!.uid, body.sessionId, body.positionSeconds, body.durationSeconds));
    });
  };
}
