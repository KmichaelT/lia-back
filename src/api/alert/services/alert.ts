/**
 * alert service
 */

import admin from 'firebase-admin';
import { factories } from '@strapi/strapi';

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

const getFirebaseApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

const normalizeData = (data?: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(data ?? {}).map(([key, value]) => [key, String(value)])
  );

export default factories.createCoreService(
  'api::alert.alert',
  ({ strapi }) => ({
    async sendToUsers(userIds: number[], payload: PushPayload) {
      if (userIds.length === 0) {
        return {
          successCount: 0,
          failureCount: 0,
          skipped: true,
          reason: 'No target users provided.',
        };
      }

      const tokens = await strapi.db.query('api::device-token.device-token').findMany({
        where: {
          isActive: true,
          user: {
            id: {
              $in: userIds,
            },
          },
        },
      });

      const uniqueTokens = [...new Set(tokens.map((entry) => entry.token).filter(Boolean))];

      return this.sendToTokens(uniqueTokens, payload);
    },

    async sendToTokens(tokens: string[], payload: PushPayload) {
      if (tokens.length === 0) {
        return {
          successCount: 0,
          failureCount: 0,
          skipped: true,
          reason: 'No active device tokens found.',
        };
      }

      const app = getFirebaseApp();
      const messaging = admin.messaging(app);

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: normalizeData(payload.data),
      });

      const invalidTokens = response.responses
        .map((result, index) => ({ result, token: tokens[index] }))
        .filter(({ result }) => {
          const code = result.error?.code;
          return (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          );
        })
        .map(({ token }) => token);

      if (invalidTokens.length > 0) {
        await strapi.db.query('api::device-token.device-token').updateMany({
          where: {
            token: {
              $in: invalidTokens,
            },
          },
          data: {
            isActive: false,
          },
        });
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidatedTokens: invalidTokens.length,
      };
    },
  })
);
