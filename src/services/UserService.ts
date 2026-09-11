import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { env } from '../config/env.js';
import { firestore } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';

function db() {
  if (!firestore) throw new AppError('FIREBASE_NOT_CONFIGURED', 'Firestore is not configured', 503);
  return firestore;
}

export class UserService {
  async getProfile(uid: string) {
    const snapshot = await db().collection('users').doc(uid).get();
    return snapshot.exists ? snapshot.data() : { uid, level: 1, exp: 0, totalWatchTime: 0, totalEpisodes: 0 };
  }

  async listFavorites(uid: string) {
    const snapshot = await db().collection('users').doc(uid).collection('favorites').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async addFavorite(uid: string, animeSlug: string, data: Record<string, unknown>) {
    await db().collection('users').doc(uid).collection('favorites').doc(animeSlug).set({ animeSlug, ...data, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    return { animeSlug };
  }

  async removeFavorite(uid: string, animeSlug: string) {
    await db().collection('users').doc(uid).collection('favorites').doc(animeSlug).delete();
    return { animeSlug };
  }

  async listHistory(uid: string) {
    const snapshot = await db().collection('users').doc(uid).collection('history').orderBy('updatedAt', 'desc').limit(100).get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async leaderboard() {
    const snapshot = await db().collection('users').orderBy('exp', 'desc').limit(100).get();
    return snapshot.docs.map((doc, index) => ({ rank: index + 1, ...doc.data() }));
  }

  async startWatch(uid: string, episodeSlug: string, durationSeconds: number) {
    const sessionId = randomUUID();
    const session = { uid, episodeSlug, durationSeconds, watchedSeconds: 0, progress: 0, rewardExp: 0, completed: false, lastHeartbeatAt: Timestamp.now(), createdAt: FieldValue.serverTimestamp() };
    await db().collection('users').doc(uid).collection('watchSessions').doc(sessionId).set(session);
    return { sessionId, episodeSlug, progress: 0 };
  }

  async heartbeat(uid: string, sessionId: string, positionSeconds: number, durationSeconds: number) {
    const reference = db().collection('users').doc(uid).collection('watchSessions').doc(sessionId);
    return db().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new AppError('WATCH_SESSION_NOT_FOUND', 'Watch session not found', 404);
      const data = snapshot.data()!;
      const previous = Number(data.watchedSeconds ?? 0);
      const safeDuration = Math.max(1, Math.min(durationSeconds, Number(data.durationSeconds ?? durationSeconds)));
      const safePosition = Math.max(0, Math.min(positionSeconds, safeDuration));
      const delta = Math.max(0, Math.min(120, safePosition - Number(data.lastPositionSeconds ?? 0)));
      const watchedSeconds = Math.min(safeDuration, previous + delta);
      const progress = watchedSeconds / safeDuration;
      transaction.update(reference, { watchedSeconds, progress, lastPositionSeconds: safePosition, lastHeartbeatAt: Timestamp.now() });
      return { sessionId, watchedSeconds, progress };
    });
  }

  async complete(uid: string, sessionId: string, positionSeconds: number, durationSeconds: number) {
    const reference = db().collection('users').doc(uid).collection('watchSessions').doc(sessionId);
    const userReference = db().collection('users').doc(uid);
    return db().runTransaction(async (transaction) => {
      const [sessionSnapshot, userSnapshot] = await Promise.all([transaction.get(reference), transaction.get(userReference)]);
      if (!sessionSnapshot.exists) throw new AppError('WATCH_SESSION_NOT_FOUND', 'Watch session not found', 404);
      const session = sessionSnapshot.data()!;
      if (session.rewardedAt) return { sessionId, rewarded: false, expAwarded: 0, reason: 'already_rewarded' };
      const safeDuration = Math.max(1, Math.min(durationSeconds, Number(session.durationSeconds ?? durationSeconds)));
      const progress = Math.max(Number(session.progress ?? 0), Math.min(1, Math.max(0, positionSeconds) / safeDuration));
      if (progress < env.COMPLETION_THRESHOLD) throw new AppError('COMPLETION_THRESHOLD_NOT_MET', 'Episode completion threshold has not been met', 400);
      const currentExp = Number(userSnapshot.data()?.exp ?? 0);
      const currentLevel = Number(userSnapshot.data()?.level ?? 1);
      const expAwarded = env.COMPLETION_EXP;
      const nextExp = currentExp + expAwarded;
      const nextLevel = Math.floor(nextExp / 100) + 1;
      transaction.update(reference, { progress, completed: true, rewardedAt: Timestamp.now(), rewardExp: expAwarded });
      transaction.set(userReference, { uid, exp: nextExp, level: Math.max(currentLevel, nextLevel), totalEpisodes: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { sessionId, rewarded: true, expAwarded, progress };
    });
  }
}
