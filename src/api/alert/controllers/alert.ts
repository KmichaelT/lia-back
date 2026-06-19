/**
 * alert controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::alert.alert',
  ({ strapi }) => ({
    async sendTestPush(ctx) {
      try {
        const user = ctx.state.user;
        const {
          title = 'Test notification',
          body = 'Push notifications are working.',
          data = {},
          targetUserId,
        } = ctx.request.body ?? {};

        if (!user) {
          return ctx.unauthorized('Authentication required.');
        }

        const recipientUserId = Number(targetUserId ?? user.id);

        if (Number.isNaN(recipientUserId)) {
          return ctx.badRequest('targetUserId must be a valid number.');
        }

        const result = await strapi
          .service('api::alert.alert')
          .sendToUsers([recipientUserId], {
            title,
            body,
            data: {
              ...data,
              type: data?.type ?? 'test_push',
            },
          });

        ctx.body = {
          message: 'Test push notification processed.',
          ...result,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        const stack =
          error instanceof Error ? error.stack : null;

        ctx.status = 500;
        ctx.body = {
          message: 'Test push failed',
          error: message,
          stack,
        };
      }
    },
  })
);