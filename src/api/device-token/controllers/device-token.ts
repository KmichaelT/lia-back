/**
 * device-token controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::device-token.device-token',
  ({ strapi }) => ({
    async register(ctx) {
      const user = ctx.state.user;
      const { token, platform } = ctx.request.body ?? {};

      if (!user) {
        return ctx.unauthorized('Authentication required.');
      }

      if (!token || !platform) {
        return ctx.badRequest('Both token and platform are required.');
      }

      const existing = await strapi.db
        .query('api::device-token.device-token')
        .findOne({
          where: { token },
        });

      const data = {
        token,
        platform,
        isActive: true,
        lastSeenAt: new Date(),
        user: user.id,
      };

      if (existing) {
        const updated = await strapi.entityService.update(
          'api::device-token.device-token',
          existing.id,
          { data }
        );

        ctx.body = {
          message: 'Device token updated successfully.',
          data: updated,
        };
        return;
      }

      const created = await strapi.entityService.create(
        'api::device-token.device-token',
        { data }
      );

      ctx.body = {
        message: 'Device token registered successfully.',
        data: created,
      };
    },

    async deactivate(ctx) {
      const user = ctx.state.user;
      const { token } = ctx.request.body ?? {};

      if (!user) {
        return ctx.unauthorized('Authentication required.');
      }

      if (!token) {
        return ctx.badRequest('Token is required.');
      }

      const existing = await strapi.db
        .query('api::device-token.device-token')
        .findOne({
          where: {
            token,
            user: user.id,
          },
        });

      if (!existing) {
        ctx.body = {
          message: 'Token not found. Nothing to deactivate.',
        };
        return;
      }

      const updated = await strapi.entityService.update(
        'api::device-token.device-token',
        existing.id,
        {
          data: {
            isActive: false,
          },
        }
      );

      ctx.body = {
        message: 'Device token deactivated successfully.',
        data: updated,
      };
    },
  })
);
