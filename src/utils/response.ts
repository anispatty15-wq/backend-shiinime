import { FastifyReply } from 'fastify';

export const ok = (reply: FastifyReply, data: unknown, statusCode = 200) => reply.code(statusCode).send({ success: true, data });
