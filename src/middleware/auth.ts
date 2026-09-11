import { FastifyReply, FastifyRequest } from 'fastify';
import { firebaseAuth } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  if (!firebaseAuth) throw new AppError('FIREBASE_NOT_CONFIGURED', 'Firebase authentication is not configured', 503);
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('UNAUTHORIZED', 'Bearer token is required', 401);
  try {
    request.user = await firebaseAuth.verifyIdToken(header.slice(7));
  } catch {
    throw new AppError('INVALID_TOKEN', 'Firebase token is invalid or expired', 401);
  }
}
