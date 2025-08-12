'use strict';

/**
 * alert router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::alert.alert');

const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/alerts/active',
      handler: 'alert.findActive',
      config: {
        auth: false, // Allow public access
        policies: [],
        middlewares: []
      }
    },
    ...defaultRouter.routes
  ]
};

module.exports = customRoutes;