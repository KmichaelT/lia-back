'use strict';

/**
 * alert controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::alert.alert', ({ strapi }) => ({
  // Custom controller method to get active alerts within time window
  async findActive(ctx) {
    const now = new Date().toISOString();
    
    const { data, meta } = await strapi.entityService.findMany('api::alert.alert', {
      filters: {
        isActive: true,
        startAt: { $lte: now },
        endAt: { $gte: now }
      },
      sort: { startAt: 'desc' },
      ...ctx.query
    });

    return { data, meta };
  }
}));