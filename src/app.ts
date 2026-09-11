import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { animeRoutes } from './routes/anime.js';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/user.js';
import { AppError } from './utils/errors.js';
import { OploverzService } from './services/OploverzService.js';

export function buildApp(providerService = new OploverzService()) {
  const app = Fastify({ logger: true, requestTimeout: env.REQUEST_TIMEOUT_MS });
  app.register(helmet);
  app.register(cors, { origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) });
  app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: env.RATE_LIMIT_WINDOW });
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'request failed');
    const knownError = error instanceof Error ? error : new Error('Unknown error');
    const statusCode = error instanceof AppError ? error.statusCode : knownError.name === 'ZodError' ? 400 : 500;
    const code = error instanceof AppError ? error.code : knownError.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';
    const message = env.NODE_ENV === 'production' && statusCode >= 500 ? 'Internal server error' : knownError.message;
    reply.code(statusCode).send({ success: false, error: { code, message } });
  });
  app.register(healthRoutes);
  app.register(animeRoutes(providerService));
  app.register(userRoutes());
  return app;
}
