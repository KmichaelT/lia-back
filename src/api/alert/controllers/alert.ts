/**
 * alert controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::alert.alert', ({ strapi }) => ({
  // Custom method to get active alerts within time window
  async findActive(ctx) {
    const now = new Date().toISOString();
    
    const alerts = await strapi.entityService.findMany('api::alert.alert', {
      filters: {
        isActive: true,
        startAt: { $lte: now },
        endAt: { $gte: now },
        publishedAt: { $notNull: true }
      },
      sort: { startAt: 'desc' },
      populate: '*'
    });

    const sanitizedEntities = await this.sanitizeOutput(alerts, ctx);
    
    return this.transformResponse(sanitizedEntities);
  }
}));