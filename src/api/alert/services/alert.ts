/**
 * alert service
 */

import admin from 'firebase-admin';
import { factories } from '@strapi/strapi';

type PrimitiveValue = string | number | boolean | null | undefined;

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, PrimitiveValue>;
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

const normalizeData = (data?: Record<string, PrimitiveValue>) =>
  Object.fromEntries(
    Object.entries(data ?? {})
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

const dedupeTokens = (tokens: Array<string | null | undefined>) => [
  ...new Set(tokens.filter(Boolean)),
] as string[];

const truncate = (value: string, max = 140) =>
  value.length <= max ? value : `${value.slice(0, max - 1)}...`;

export default factories.createCoreService(
  'api::alert.alert',
  ({ strapi }) => ({
    shouldNotifyCreate(entry: any) {
      return !!entry?.publishedAt;
    },

    shouldNotifyUpdate(before: any, after: any) {
      return (!before?.publishedAt && !!after?.publishedAt) || !!after?.publishedAt;
    },

    async sendToUsers(userIds: number[], payload: NotificationPayload) {
      if (userIds.length === 0) {
        return {
          successCount: 0,
          failureCount: 0,
          invalidatedTokens: 0,
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

      return this.sendToTokens(
        dedupeTokens(tokens.map((entry: any) => entry.token)),
        payload
      );
    },

    async sendToAllUsers(payload: NotificationPayload) {
      const tokens = await strapi.db.query('api::device-token.device-token').findMany({
        where: {
          isActive: true,
        },
      });

      return this.sendToTokens(
        dedupeTokens(tokens.map((entry: any) => entry.token)),
        payload
      );
    },

    async sendToTokens(tokens: string[], payload: NotificationPayload) {
      if (tokens.length === 0) {
        return {
          successCount: 0,
          failureCount: 0,
          invalidatedTokens: 0,
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

    async notifyEvent(entry: any, action: 'created' | 'updated') {
      if (!entry?.publishedAt) {
        return {
          skipped: true,
          reason: 'Event is not published.',
        };
      }

      return this.sendToAllUsers({
        title: action === 'created' ? 'New event available' : 'Event updated',
        body: truncate(entry.title || 'An event has been updated.'),
        data: {
          type: action === 'created' ? 'event_created' : 'event_updated',
          entity: 'event',
          entityId: entry.id,
          title: entry.title,
        },
      });
    },

    async notifyCause(entry: any, action: 'created' | 'updated') {
      if (!entry?.publishedAt) {
        return {
          skipped: true,
          reason: 'Project is not published.',
        };
      }

      return this.sendToAllUsers({
        title: action === 'created' ? 'New project available' : 'Project updated',
        body: truncate(entry.title || 'A project has been updated.'),
        data: {
          type: action === 'created' ? 'cause_created' : 'cause_updated',
          entity: 'cause',
          entityId: entry.id,
          title: entry.title,
        },
      });
    },

    async notifyAlert(entry: any, action: 'created' | 'updated') {
      if (!entry?.publishedAt || !entry?.isActive) {
        return {
          skipped: true,
          reason: 'Alert is not active or not published.',
        };
      }

      return this.sendToAllUsers({
        title:
          entry.title ||
          (action === 'created' ? 'New announcement' : 'Announcement updated'),
        body: truncate(entry.message || 'There is a new announcement.'),
        data: {
          type: action === 'created' ? 'alert_created' : 'alert_updated',
          entity: 'alert',
          entityId: entry.id,
          linkUrl: entry.linkUrl,
        },
      });
    },

    async notifyChildSponsor(childId: number, action: 'assigned' | 'updated') {
      const child = await strapi.db.query('api::child.child').findOne({
        where: { id: childId },
        populate: {
          sponsor: {
            populate: ['user'],
          },
        },
      });

      const sponsorUserId = child?.sponsor?.user?.id;

      if (!child || !sponsorUserId) {
        return {
          skipped: true,
          reason: 'Child has no linked sponsor user.',
        };
      }

      return this.sendToUsers([sponsorUserId], {
        title:
          action === 'assigned'
            ? 'A child has been assigned to you'
            : 'Child profile updated',
        body:
          action === 'assigned'
            ? truncate(`${child.fullName || 'A child'} is now linked to your sponsorship account.`)
            : truncate(`${child.fullName || 'A child'} has new profile information available.`),
        data: {
          type: action === 'assigned' ? 'child_assigned' : 'child_updated',
          entity: 'child',
          entityId: child.id,
          childName: child.fullName,
        },
      });
    },
  })
);
