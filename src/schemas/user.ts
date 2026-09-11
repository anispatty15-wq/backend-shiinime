import { z } from 'zod';

export const favoriteBodySchema = z.object({
  animeSlug: z.string().trim().min(1).max(200).regex(/^[a-zA-Z0-9-]+$/),
  anime: z.record(z.string(), z.unknown()).default({})
});

export const watchStartSchema = z.object({ episodeSlug: z.string().trim().min(1).max(200), durationSeconds: z.number().finite().positive().max(24 * 60 * 60) });
export const watchHeartbeatSchema = z.object({ sessionId: z.string().uuid(), positionSeconds: z.number().finite().nonnegative(), durationSeconds: z.number().finite().positive().max(24 * 60 * 60) });
export const watchCompleteSchema = watchHeartbeatSchema;
