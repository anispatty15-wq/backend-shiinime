import { z } from 'zod';

export const slugSchema = z.object({
  slug: z.string().trim().min(1).max(200).regex(/^[a-zA-Z0-9-]+$/)
});

export const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

export const searchParamsSchema = z.object({
  query: z.string().trim().min(1).max(100)
});
